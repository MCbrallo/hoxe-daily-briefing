import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: items } = await s.from('briefing_items').select('app_date, title, category, metadata_spotify_track_id').in('category', ['music', 'viral_music']);
  
  const unresolved = items?.filter(c => !(c.metadata_spotify_track_id?.length > 5)) || [];
  
  const out = unresolved.map(c => `[${c.app_date}] : ${c.title}`).join('\n');
  fs.writeFileSync('tmp_unresolved_music.txt', `Total Unresolved: ${unresolved.length}\n${out}`, 'utf-8');
}
run();
