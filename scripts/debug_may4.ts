import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data } = await supabase.from('daily_briefings').select('date, briefing_items(*)').eq('date', "May 4").single();
  fs.writeFileSync('C:/tmp/may4.json', JSON.stringify(data?.briefing_items[0], null, 2));
}
run();
