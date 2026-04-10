import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function audit() {
  const r = await s.from("briefing_items").select("category,title,year,image_url").order("category");
  const d = r.data || [];
  const lines: string[] = [];
  lines.push(`Total: ${d.length}, With images: ${d.filter(i => i.image_url).length}`);
  
  const cats: Record<string, { total: number; img: number }> = {};
  d.forEach(i => {
    if (!cats[i.category]) cats[i.category] = { total: 0, img: 0 };
    cats[i.category].total++;
    if (i.image_url) cats[i.category].img++;
  });
  Object.keys(cats).sort().forEach(c => lines.push(`${c}: ${cats[c].total} items, ${cats[c].img} imgs`));
  lines.push("");
  d.forEach(i => lines.push(`${i.image_url ? "[IMG]" : "[---]"} ${i.category.padEnd(14)} | ${(i.year || "?").toString().padEnd(6)} | ${(i.title || "").substring(0, 55)}`));
  
  fs.writeFileSync("C:\\tmp\\audit.txt", lines.join("\n"));
  console.log("Audit written to C:\\tmp\\audit.txt");
}
audit();
