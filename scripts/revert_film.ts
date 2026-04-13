import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { error: err2 } = await supabase.from('briefing_items').update({ category: 'film and television' }).eq('category', 'film');
  if (err2) console.error('Error 2:', err2);
  console.log('DB Revert complete');
}
run();
