import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Map granular Excel categories to the 8 core app categories
const CATEGORY_NORMALIZATION: Record<string, string> = {
  "physics": "science",
  "biology and medicine": "science",
  "film and television": "culture",
  "politics and government": "history",
  "art and architecture": "culture",
  "environment": "science",
  "business and economy": "history",
  "literature": "culture",
  "exploration": "history",
  "religion": "history",
  "technology": "science",
  "law": "history",
  "philosophy": "culture",
};

async function main() {
  console.log("Normalizing categories...\n");
  
  for (const [from, to] of Object.entries(CATEGORY_NORMALIZATION)) {
    const { data, error } = await s.from("briefing_items")
      .update({ category: to })
      .eq("category", from)
      .select("id");
    
    if (data && data.length > 0) {
      console.log(`  "${from}" → "${to}": ${data.length} cards updated`);
    }
  }

  console.log("\n✅ Category normalization complete.");
}

main();
