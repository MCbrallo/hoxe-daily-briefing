import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase.from("daily_briefings").select("date, briefing_items(category)").in("date", ["April 20", "April 26"]);
  if(data) {
    for (const d of data) {
       const daily = d.briefing_items.filter((i:any) => !i.category.startsWith("viral_")).length;
       const viral = d.briefing_items.filter((i:any) => i.category.startsWith("viral_")).length;
       console.log(`Date: ${d.date} | Daily Cards: ${daily} | Viral Cards: ${viral}`);
    }
  }
}
check();
