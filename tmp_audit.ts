import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  // Get all May 1-17 items
  const mayDates = [];
  for (let d = 1; d <= 17; d++) mayDates.push(`May ${d}`);
  
  for (const date of mayDates) {
    const { data: briefing } = await s.from("daily_briefings").select("id").eq("date", date).single();
    if (!briefing) { console.log(`--- ${date}: NOT FOUND ---`); continue; }
    
    const { data: items } = await s.from("briefing_items")
      .select("id, title, category, image_url, image_source")
      .eq("briefing_id", briefing.id);
    
    console.log(`\n=== ${date} (${items?.length || 0} cards) ===`);
    for (const it of items || []) {
      const isGeneric = it.image_url?.includes('unsplash') || it.image_source?.includes('Fallback');
      const isWiki = it.image_url?.includes('wiki') || it.image_source?.includes('Wikipedia');
      const tag = isWiki ? '📷 WIKI' : isGeneric ? '🔴 GENERIC' : it.image_url ? '🟡 OTHER' : '⚪ NONE';
      console.log(`  ${tag} | ${it.category?.padEnd(25)} | ${it.title?.substring(0, 60)}`);
    }
  }
  
  // Also check April 20
  console.log("\n\n========== APRIL 20 ==========");
  const { data: apr20 } = await s.from("daily_briefings").select("id").eq("date", "April 20").single();
  if (apr20) {
    const { data: items } = await s.from("briefing_items")
      .select("id, title, category, why_it_matters, image_url, image_source")
      .eq("briefing_id", apr20.id);
    
    for (const it of items || []) {
      const isGeneric = it.image_url?.includes('unsplash') || it.image_source?.includes('Fallback');
      const isWiki = it.image_url?.includes('wiki') || it.image_source?.includes('Wikipedia');
      const tag = isWiki ? '📷 WIKI' : isGeneric ? '🔴 GENERIC' : it.image_url ? '🟡 OTHER' : '⚪ NONE';
      console.log(`  ${tag} | ${it.category?.padEnd(25)} | ${it.title?.substring(0, 50)}`);
      console.log(`    Context (first 120 chars): ${it.why_it_matters?.substring(0, 120)}`);
    }
  }
}

main();
