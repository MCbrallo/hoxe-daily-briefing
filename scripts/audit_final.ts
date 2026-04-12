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
  let output = "";
  let totalWiki = 0, totalOther = 0, noImage = 0;
  const stillBad: any[] = [];

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
        noImage++;
        stillBad.push({ id: item.id, date, title: item.title, issue: "no_image" });
      } else if (item.image_source?.includes("Wikipedia") || item.image_source?.includes("Wikimedia")) {
        totalWiki++;
      } else {
        totalOther++;
        stillBad.push({ id: item.id, date, title: item.title, category: item.category, source: item.image_source, url: item.image_url?.substring(0, 80) });
      }
    }
  }

  output += `Wikipedia/Wikimedia images: ${totalWiki}\n`;
  output += `Non-Wikipedia images: ${totalOther}\n`;
  output += `No image at all: ${noImage}\n`;
  output += `\nCards still needing proper images: ${stillBad.length}\n`;
  for (const c of stillBad) {
    output += `  - [${c.date}] ${c.title} (${c.source || c.issue})\n`;
  }

  fs.writeFileSync("tmp_image_status.txt", output, "utf-8");
  console.log(output);
}

audit().catch(console.error);
