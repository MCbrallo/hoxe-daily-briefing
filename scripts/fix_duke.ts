import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: cards } = await s.from("briefing_items").select("id, title, metadata_spotify_track_id").eq("category", "music").like("title", "%Duke%");
  if (!cards) return;

  for (const card of cards) {
    if (!card.metadata_spotify_track_id) continue;
    let payload = JSON.parse(card.metadata_spotify_track_id);
    
    // Replace with standard Duke Ellington - Take the A Train, known to be 100% embed playable
    payload.spotifyId = "qDQpZT3GhDg";
    
    await s.from("briefing_items").update({
      metadata_spotify_track_id: JSON.stringify(payload)
    }).eq("id", card.id);
    
    console.log(`✅ Fixed Duke!`);
  }
}
run();
