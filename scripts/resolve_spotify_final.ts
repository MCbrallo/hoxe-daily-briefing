import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function extractMusicQuery(title: string): string {
  let q = title;
  const birthMatch = q.match(/^Birth Of (.+)$/i);
  if (birthMatch) return birthMatch[1].trim();
  const billboardMatch = q.match(/^(.+?)\s+(?:Leads|Reaches|Tops)\s+The\s+Billboard.*?(?:With|Summit With)\s+(.+)$/i);
  if (billboardMatch) return `${billboardMatch[1].replace(/\s+Ft\.?\s+.*/i, '').trim()} ${billboardMatch[2].trim()}`;
  const releaseMatch = q.match(/^(.+?)\s+(?:Releases?|Records?)\s+(?:Her|His|Their|The)?\s*(?:Single|Album|Song)?\s*["\"]?(.+?)["\"]?\s*$/i);
  if (releaseMatch) return `${releaseMatch[1].trim()} ${releaseMatch[2].replace(/[""]/g, '').trim()}`;
  const classicalMatch = q.match(/^(.+?)['']s?\s+(?:Opera|Symphony|Oratorio|Passion)\s+["""]?(.+?)["""]?\s+(?:Premieres|Opens|Debuts)/i);
  if (classicalMatch) return `${classicalMatch[1].trim()} ${classicalMatch[2].trim()}`;
  const quoted = q.match(/["""](.+?)["""]/);
  if (quoted) {
    const beforeQuote = q.substring(0, q.indexOf(quoted[0])).trim();
    const names = beforeQuote.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (names) return `${names[0]} ${quoted[1]}`;
    return quoted[1];
  }
  q = q.replace(/\s*\(\d+\)\s*/g, ' ');
  q = q.replace(/\b(Ft\.?|Featuring)\b/gi, '');
  return q.trim();
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const r = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player");
    if (!r.ok) return null;
    const data = await r.json();
    cachedToken = data.accessToken;
    tokenExpiry = data.accessTokenExpirationTimestampMs - 60000;
    return cachedToken;
  } catch(e) {
    return null;
  }
}

async function searchSpotify(query: string, rawTrackId: string): Promise<any | null> {
  const token = await getSpotifyToken();
  if (!token) return null;
  
  // If the rawTrackId is provided and looks like a Spotify ID (22 base62 chars)
  if (rawTrackId && rawTrackId.length === 22 && !rawTrackId.includes(' ')) {
    try {
      const r = await fetch(`https://api.spotify.com/v1/tracks/${rawTrackId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (r.ok) {
        const t = await r.json();
        return {
          spotifyId: t.id,
          spotifyTitle: t.name,
          spotifyArtist: t.artists[0]?.name || '',
          spotifyCover: t.album?.images[0]?.url || ''
        };
      }
    } catch(e) {}
  }

  // Otherwise, fallback to Search
  try {
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    const r = await fetch(searchUrl, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (r.ok) {
      const data = await r.json();
      const t = data.tracks?.items?.[0];
      if (t) {
        return {
          spotifyId: t.id,
          spotifyTitle: t.name,
          spotifyArtist: t.artists[0]?.name || '',
          spotifyCover: t.album?.images[0]?.url || ''
        };
      }
    }
  } catch(e) {}
  return null;
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  HOXE MUSIC RESOLVER — SPOTIFY ONLY                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  let musicCards: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await s.from("briefing_items")
      .select("id, title, category, metadata_spotify_track_id")
      .or('category.eq.music,category.eq.viral_music')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    musicCards = musicCards.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`[INFO] Found ${musicCards.length} music cards. Resolving Spotify tracks...\n`);

  let resolved = 0;
  let failed = 0;

  for (let i = 0; i < musicCards.length; i++) {
    const card = musicCards[i];
    const query = extractMusicQuery(card.title);
    
    // Check if we already have some metadata to extract raw ID
    let rawTrackId = '';
    if (card.metadata_spotify_track_id) {
       try {
         const meta = JSON.parse(card.metadata_spotify_track_id);
         rawTrackId = meta.deezerId || meta.spotifyId || '';
       } catch {
         rawTrackId = card.metadata_spotify_track_id;
       }
    }

    process.stdout.write(`  [${i+1}/${musicCards.length}] ${card.title.substring(0, 40).padEnd(40)} → `);

    const track = await searchSpotify(query, rawTrackId);

    if (track) {
      await s.from("briefing_items").update({
        metadata_spotify_track_id: JSON.stringify(track)
      }).eq("id", card.id);
      resolved++;
      console.log(`✅ [${track.spotifyId}] ${track.spotifyArtist} - ${track.spotifyTitle}`);
    } else {
      // CLEAR the old deezer ID so it doesn't break
      await s.from("briefing_items").update({
        metadata_spotify_track_id: null
      }).eq("id", card.id);
      failed++;
      console.log(`❌ Cleared`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  RESOLVED: ${resolved} | FAILED: ${failed}`);
  console.log(`═══════════════════════════════════════`);
}

main();
