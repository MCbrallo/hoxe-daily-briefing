import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const { data } = await supabase.from("briefing_items")
    .select("id, title, category, metadata_spotify_track_id")
    .in("category", ["music", "viral_music"]);
    
  if (data) {
    const missing = data.filter(d => !d.metadata_spotify_track_id || JSON.stringify(d.metadata_spotify_track_id) === '"{}"');
    console.log(`Found ${missing.length} missing songs.`);
    missing.forEach(m => console.log(` - [${m.category}] ${m.title}`));
  }
}
main();
