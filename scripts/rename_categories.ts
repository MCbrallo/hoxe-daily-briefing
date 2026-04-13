import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { error: err1 } = await supabase.from('briefing_items').update({ category: 'business' }).eq('category', 'business and economy');
  if (err1) console.error('Error 1:', err1);
  const { error: err2 } = await supabase.from('briefing_items').update({ category: 'film' }).eq('category', 'film and television');
  if (err2) console.error('Error 2:', err2);
  console.log('DB Update complete');
}
run();
