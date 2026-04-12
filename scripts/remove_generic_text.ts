import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("Fetching all items to clean up generic text...");
  const { data: items } = await supabase.from("briefing_items").select("id, why_it_matters");
  
  if (!items) return;
  console.log(`Checking ${items.length} items...`);

  let cleanedCount = 0;

  const generic1 = "This event serves as a crucial historical milestone, demonstrating the profound ripple effects such occurrences have across culture and society.";
  const generic2 = "Its legacy continues to be studied by historians and enthusiasts alike, providing vital context for understanding subsequent developments in this field.";

  for (const item of items) {
    if (!item.why_it_matters) continue;
    
    let text = item.why_it_matters as string;
    let modified = false;

    if (text.includes(generic1)) {
        text = text.replace(generic1, "");
        modified = true;
    }
    if (text.includes(generic2)) {
        text = text.replace(generic2, "");
        modified = true;
    }

    if (modified) {
       // Clean up any double blank lines caused by the removal
       text = text.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
       
       await supabase
         .from("briefing_items")
         .update({ why_it_matters: text })
         .eq("id", item.id);
         
       cleanedCount++;
       process.stdout.write("🗑️ ");
    } else {
       process.stdout.write(".");
    }
  }
  
  console.log(`\n\nCleaned up generic text from ${cleanedCount} items.`);
}

main().catch(console.error);
