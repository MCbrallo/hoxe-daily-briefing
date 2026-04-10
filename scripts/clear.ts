import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function clearAndRegenerate() {
  console.log("Clearing all data...");
  await s.from("briefing_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await s.from("daily_briefings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Data cleared. Now regenerating...");
}
clearAndRegenerate();
