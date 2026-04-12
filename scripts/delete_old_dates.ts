import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const allowedDates = ["April 20", "April 21", "April 22", "April 23", "April 24", "April 25", "April 26"];
  
  console.log("Fetching all dates in the database...");
  const { data: allDates, error } = await supabase.from("daily_briefings").select("date");
  
  if (error || !allDates) {
    console.error("Error fetching dates:", error);
    return;
  }
  
  const datesToDelete = allDates.map(d => d.date).filter(date => !allowedDates.includes(date));
  
  if (datesToDelete.length === 0) {
    console.log("No dates to delete. Only April 20-26 exist.");
    return;
  }
  
  console.log(`Deleting ${datesToDelete.length} dates:`);
  console.log(datesToDelete.join(", "));
  
  for (const date of datesToDelete) {
     const { error: delError } = await supabase.from("daily_briefings").delete().eq("date", date);
     if (delError) {
         console.error(`Error deleting ${date}:`, delError);
     } else {
         process.stdout.write(`✅ Deleted ${date}\n`);
     }
  }
  
  console.log("\nComplete! Only April 20 through 26 remain in the database.");
}

main().catch(console.error);
