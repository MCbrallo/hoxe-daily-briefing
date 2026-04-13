import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { error } = await supabase.from('briefing_items').update({ category: 'politics' }).eq('category', 'politics and government');
  if (error) { console.error('DB Update error:', error); } else { console.log('DB Update complete'); }
}
run();
