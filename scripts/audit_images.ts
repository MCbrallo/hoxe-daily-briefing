import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function audit() {
  const dates = ["April 20", "April 21", "April 22", "April 23", "April 24", "April 25", "April 26"];
  
  let wikiCount = 0;
  let unsplashCount = 0;
  let noImageCount = 0;
  const unsplashCards: any[] = [];

  for (const date of dates) {
    const { data } = await supabase
      .from("daily_briefings")
      .select("*, briefing_items (*)")
      .eq("date", date)
      .limit(1)
      .single();

    if (!data) continue;
    
    for (const item of (data.briefing_items || [])) {
      if (!item.image_url) {
        noImageCount++;
      } else if (item.image_source === "Wikipedia") {
        wikiCount++;
      } else {
        unsplashCount++;
        unsplashCards.push({
          id: item.id,
          date: date,
          category: item.category,
          title: item.title,
          image_source: item.image_source
        });
      }
    }
  }

  const output = {
    summary: { wikiCount, unsplashCount, noImageCount, total: wikiCount + unsplashCount + noImageCount },
    cardsNeedingImages: unsplashCards
  };

  fs.writeFileSync("tmp_image_audit.json", JSON.stringify(output, null, 2), "utf-8");
  console.log(`Wiki images: ${wikiCount}`);
  console.log(`Unsplash fallbacks (NEED REPLACEMENT): ${unsplashCount}`);
  console.log(`No image: ${noImageCount}`);
  console.log(`Written to tmp_image_audit.json`);
}

audit().catch(console.error);
