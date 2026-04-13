import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ytSearch from "yt-search";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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

async function run() {
  console.log("=== REBUILDING AUTHENTIC MUSIC DB VIA BULLETPROOF YOUTUBE API ===");
  
  const { data: cards } = await s.from("briefing_items")
    .select("id, title, category, metadata_spotify_track_id")
    .in("category", ["music", "viral_music"]);
  
  if (!cards) return;

  // We are searching YouTube ONLY for cards that organically have 'music' category.
  const cardsToFix = cards.filter(c => !c.metadata_spotify_track_id || c.metadata_spotify_track_id.length < 5);
  console.log(`Found ${cardsToFix.length} empty authentic music cards. Fetching top YouTube Official Tracks...\n`);

  let resolved = 0;
  let failed = 0;

  for (const card of cardsToFix) {
    const query = extractMusicQuery(card.title) + " official audio";
    process.stdout.write(`Resolving "${query}"... `);

    try {
      const r = await ytSearch(query);
      const video = r.videos[0];

      if (video) {
        const payload = JSON.stringify({
          spotifyId: video.videoId, // We reuse the `spotifyId` field since the UI dynamic detects length 11 as YouTube!
          spotifyTitle: card.title, // Keep original historical card title text
          spotifyArtist: video.author.name,
          spotifyCover: video.thumbnail
        });

        await s.from("briefing_items").update({ metadata_spotify_track_id: payload }).eq("id", card.id);
        console.log(`✅ [${video.videoId}] ${video.title.substring(0, 30)}`);
        resolved++;
      } else {
        console.log(`❌ Not found`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ Error searching yt`);
      failed++;
    }
  }

  console.log(`\nDONE. Resolved ${resolved}, Failed ${failed}`);
}
run();
