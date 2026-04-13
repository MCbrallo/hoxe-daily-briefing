import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: b } = await s.from("daily_briefings").select("id").eq("date", "April 26").single();
  if(!b) { console.log("No April 26 briefing"); return; }
  const { data: items } = await s.from('briefing_items').select('title, category, metadata_spotify_track_id').eq('briefing_id', b.id);
  items?.filter(c => c.category === 'music').forEach(c => console.log(`[Music] : ${c.title} -> ID: ${c.metadata_spotify_track_id}`));
}
run();
