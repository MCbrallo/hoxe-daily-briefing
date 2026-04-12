import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkDeadImages() {
  const dates = ["April 20", "April 21", "April 22", "April 23", "April 24", "April 25", "April 26"];
  const badImages: any[] = [];
  
  for (const date of dates) {
    const { data } = await supabase
      .from("daily_briefings")
      .select("*, briefing_items (*)")
      .eq("date", date)
      .limit(1)
      .single();

    if (!data) continue;

    const items = data.briefing_items || [];
    for (const item of items) {
      if (!item.image_url) continue;

      try {
        const res = await fetch(item.image_url, { method: 'HEAD', headers: { 'User-Agent': 'HoxeBot/1.0' } });
        if (!res.ok) {
          console.log(`❌ [${item.title}] returned ${res.status}: ${item.image_url}`);
          badImages.push({ id: item.id, title: item.title, url: item.image_url, status: res.status });
        }
      } catch (e: any) {
         console.log(`❌ [${item.title}] fetch failed: ${e.message} - ${item.image_url}`);
         badImages.push({ id: item.id, title: item.title, url: item.image_url, error: e.message });
      }
    }
  }

  console.log(`\nFound ${badImages.length} bad images.`);
  import("fs").then(fs => fs.writeFileSync("tmp_bad_images.json", JSON.stringify(badImages, null, 2)));
}

checkDeadImages().catch(console.error);
