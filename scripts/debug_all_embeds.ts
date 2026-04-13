import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: cards } = await s.from("briefing_items").select("id, title, metadata_spotify_track_id").eq("category", "music");
  if (!cards) return;

  for (const card of cards) {
    if (!card.metadata_spotify_track_id) continue;
    try {
      const payload = JSON.parse(card.metadata_spotify_track_id);
      if (payload.spotifyId && payload.spotifyId.length === 11) {
        const res = await fetch(`https://www.youtube.com/embed/${payload.spotifyId}`);
        const text = await res.text();
        if (/video unavailable|unplayable/i.test(text)) {
          console.log(`BLOCKED: ${card.title} -> ${payload.spotifyId}`);
        }
      }
    } catch (e) {}
  }
}
run();
