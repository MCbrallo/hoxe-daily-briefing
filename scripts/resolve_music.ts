import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Extract a good search query from the card title.
 * Examples:
 *   "Aretha Franklin Releases Her Single \"Respect\"" → "Aretha Franklin Respect"
 *   "Birth Of Duke Ellington" → "Duke Ellington"
 *   "50 Cent Ft. Olivia Leads The Billboard Hot 100 With Candy Shop" → "50 Cent Candy Shop"
 *   "Gotye Ft. Kimbra Leads The Billboard Hot 100 With Somebody That I Used To Know" → "Gotye Somebody That I Used To Know"
 */
function extractMusicQuery(title: string): string {
  let q = title;

  // "Birth Of X" → just X
  const birthMatch = q.match(/^Birth Of (.+)$/i);
  if (birthMatch) return birthMatch[1].trim();

  // "X Leads The Billboard Hot 100 With Y" → "X Y"
  const billboardMatch = q.match(/^(.+?)\s+(?:Leads|Reaches|Tops)\s+The\s+Billboard.*?(?:With|Summit With)\s+(.+)$/i);
  if (billboardMatch) {
    const artist = billboardMatch[1].replace(/\s+Ft\.?\s+.*/i, '').trim();
    const song = billboardMatch[2].trim();
    return `${artist} ${song}`;
  }

  // "X Releases Her/His Single \"Y\"" → "X Y"
  const releaseMatch = q.match(/^(.+?)\s+(?:Releases?|Records?)\s+(?:Her|His|Their|The)?\s*(?:Single|Album|Song)?\s*["\"]?(.+?)["\"]?\s*$/i);
  if (releaseMatch) {
    const artist = releaseMatch[1].trim();
    const song = releaseMatch[2].replace(/[""]/g, '').trim();
    return `${artist} ${song}`;
  }

  // "X's Opera/Symphony \"Y\" Premieres" → "X Y"
  const classicalMatch = q.match(/^(.+?)['']s?\s+(?:Opera|Symphony|Oratorio|Passion)\s+["""]?(.+?)["""]?\s+(?:Premieres|Opens|Debuts)/i);
  if (classicalMatch) {
    return `${classicalMatch[1].trim()} ${classicalMatch[2].trim()}`;
  }

  // Generic: strip common noise, keep names and quoted titles
  const quoted = q.match(/["""](.+?)["""]/);
  if (quoted) {
    // Extract proper nouns before the quote
    const beforeQuote = q.substring(0, q.indexOf(quoted[0])).trim();
    const names = beforeQuote.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (names) {
      return `${names[0]} ${quoted[1]}`;
    }
    return quoted[1];
  }

  // Fallback: clean up
  q = q.replace(/\s*\(\d+\)\s*/g, ' '); // remove ages
  q = q.replace(/\b(Ft\.?|Featuring)\b/gi, ''); // remove featuring
  
  return q.trim();
}

interface DeezerTrack {
  id: number;
  title: string;
  artist: string;
  albumCover: string;
  preview: string;
}

async function searchDeezer(query: string): Promise<DeezerTrack | null> {
  try {
    const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`);
    const d = await r.json();
    const t = d.data?.[0];
    if (t) {
      return {
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        albumCover: t.album.cover_xl || t.album.cover_big || t.album.cover_medium || '',
        preview: t.preview || ''
      };
    }
  } catch {}
  return null;
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  HOXE MUSIC RESOLVER — Deezer Track ID Patching     ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  // Get all music category cards
  let musicCards: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await s.from("briefing_items")
      .select("id, title, category")
      .eq("category", "music")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    musicCards = musicCards.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`[INFO] Found ${musicCards.length} music cards. Resolving tracks...\n`);

  let resolved = 0;
  let failed = 0;

  for (let i = 0; i < musicCards.length; i++) {
    const card = musicCards[i];
    const query = extractMusicQuery(card.title);
    
    process.stdout.write(`  [${i+1}/${musicCards.length}] ${card.title.substring(0, 45).padEnd(45)} → "${query.substring(0, 25)}" `);

    const track = await searchDeezer(query);

    if (track) {
      // Store Deezer data as JSON in metadata_spotify_track_id (repurposing the field)
      const metadata = JSON.stringify({
        deezerId: String(track.id),
        deezerTitle: track.title,
        deezerArtist: track.artist,
        deezerCover: track.albumCover,
        deezerPreview: track.preview
      });

      await s.from("briefing_items").update({
        metadata_spotify_track_id: metadata
      }).eq("id", card.id);

      resolved++;
      console.log(`✅ ${track.artist} - ${track.title}`);
    } else {
      failed++;
      console.log(`❌`);
    }

    // Small delay to be kind to Deezer's API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  RESOLVED: ${resolved} | FAILED: ${failed}`);
  console.log(`═══════════════════════════════════════`);
}

main();
