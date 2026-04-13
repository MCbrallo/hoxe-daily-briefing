import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkImage() {
  const { data, error } = await supabase
    .from("briefing_items")
    .select("id, title, image_url, image_source")
    .ilike("title", "%San Remo%");

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Result:", data);
  }
}

checkImage();
