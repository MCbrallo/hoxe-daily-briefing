import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  for (const date of ["May 1", "May 3", "May 10", "May 17"]) {
    const { data: briefing } = await s.from("daily_briefings").select("id").eq("date", date).single();
    if (!briefing) continue;
    const { data: items } = await s.from("briefing_items")
      .select("title, image_url")
      .eq("briefing_id", briefing.id);
    
    const withImg = (items || []).filter(i => i.image_url);
    const withoutImg = (items || []).filter(i => !i.image_url);
    
    console.log(`\n${date}: ${(items||[]).length} total | ${withImg.length} with image | ${withoutImg.length} without`);
    for (const i of withImg) {
      console.log(`  📷 ${i.title.substring(0, 50)} → ${i.image_url?.substring(0, 60)}...`);
    }
  }
  
  // Also verify April 20 context
  console.log("\n\n=== APRIL 20 CONTEXT SAMPLE ===");
  const { data: apr } = await s.from("daily_briefings").select("id").eq("date", "April 20").single();
  if (apr) {
    const { data: items } = await s.from("briefing_items")
      .select("title, why_it_matters")
      .eq("briefing_id", apr.id)
      .limit(3);
    for (const i of items || []) {
      console.log(`\n  ${i.title}:`);
      console.log(`  ${i.why_it_matters?.substring(0, 200)}...`);
    }
  }
}
main();
