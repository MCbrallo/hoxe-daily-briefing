import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ytSearch from "yt-search";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  console.log("=== FIXING REMAINING MUSIC CARDS ===");
  
  const { data: cards } = await s.from("briefing_items")
    .select("id, title, category, metadata_spotify_track_id")
    .in("category", ["music", "viral_music"]);
  
  if (!cards) return;

  const cardsToFix = cards.filter(c => !c.metadata_spotify_track_id || c.metadata_spotify_track_id === 'null' || c.metadata_spotify_track_id.length < 5);
  console.log(`Found ${cardsToFix.length} empty authentic music cards remaining.`);

  let resolved = 0;
  let failed = 0;

  for (const card of cardsToFix) {
    // Just search the raw title. It guarantees a youtube hit 99.9% of the time.
    const query = card.title + " song";
    process.stdout.write(`Resolving "${query}"... `);

    try {
      const r = await ytSearch(query);
      const video = r.videos[0];

      if (video) {
        const payload = JSON.stringify({
          spotifyId: video.videoId, // Re-use the UI map 
          spotifyTitle: card.title,
          spotifyArtist: video.author.name,
          spotifyCover: video.thumbnail
        });

        await s.from("briefing_items").update({ metadata_spotify_track_id: payload }).eq("id", card.id);
        console.log(`✅ [${video.videoId}]`);
        resolved++;
      } else {
        console.log(`❌ Not found`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ytSearch Error`);
      failed++;
    }
  }

  console.log(`\nDONE. Resolved ${resolved}, Failed ${failed}`);
}
run();
