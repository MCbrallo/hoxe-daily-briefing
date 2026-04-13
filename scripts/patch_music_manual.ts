import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ytSearch from "yt-search";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const MANUAL_MAP: Record<string, string> = {
  "Handel'S Messiah Premieres In Dublin": "IUZEtVbJT5c", // Hallelujah Chorus
  "Bob Marley Dies": "HNBCVM4RmWU", // Three Little Birds
  "Aram Khachaturian Dies": "mUQHGpxjzSQ", // Sabre Dance
  "Burt Bacharach Is Born": "8XcwGEiErz4", // Raindrops Keep Fallin' on My Head
  "First Grammy Awards Are Presented": "xMtuVP8Rw4c", // Volare
  "First Grammy Awards": "xMtuVP8Rw4c",
  "Bob Marley": "HNBCVM4RmWU"
};

async function run() {
  const { data: cards } = await s.from("briefing_items").select("id, title").in("category", ["music", "viral_music"]);
  if (!cards) return;

  for (const card of cards) {
    for (const [key, videoId] of Object.entries(MANUAL_MAP)) {
      if (card.title.includes(key)) {
        console.log(`Fixing manual override for: ${card.title}`);
        try {
          const r = await ytSearch({ videoId });
          const payload = JSON.stringify({
            spotifyId: r.videoId,
            spotifyTitle: card.title,
            spotifyArtist: r.author.name,
            spotifyCover: r.thumbnail
          });
          await s.from("briefing_items").update({ metadata_spotify_track_id: payload }).eq("id", card.id);
          console.log(`✅ Patched -> ${r.title}`);
        } catch(e) {
          console.log(`❌ Failed to patch ${card.title}`);
        }
      }
    }
  }
}
run();
