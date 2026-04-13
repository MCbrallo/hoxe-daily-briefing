import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data } = await s.from("briefing_items")
    .select("id, title, category, metadata_spotify_track_id")
    .in("category", ["music", "viral_music"])
    .order("id", { ascending: false });
    
  if (data) {
    const missing = data.filter(d => !d.metadata_spotify_track_id);
    console.log("Missing IDs:", missing.length);
    missing.forEach(m => console.log(" -", m.title));
  }
}

run();
