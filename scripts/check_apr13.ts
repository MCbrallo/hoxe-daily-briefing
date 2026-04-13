import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: b } = await s.from("daily_briefings").select("id").eq("date", "April 13").single();
  if(!b) return;
  const { data: items } = await s.from('briefing_items').select('title, category, metadata_spotify_track_id').eq('briefing_id', b.id);
  const out = items?.map(c => `[${c.category}] : ${c.title} -> Has ID: ${!!(c.metadata_spotify_track_id?.length > 5)}`).join('\n') || '';
  fs.writeFileSync('tmp_apr13_native.txt', out, 'utf-8');
}
run();
