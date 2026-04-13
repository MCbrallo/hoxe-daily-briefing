import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const dates = ["May 18", "May 19", "May 20", "May 21", "May 22", "May 23", "May 24"];
  const lines: string[] = [];
  lines.push("HOXE MAY 18-24 AUDIT");
  lines.push("====================");
  lines.push("");

  for (const date of dates) {
    const { data: briefing } = await supabase.from("daily_briefings").select("id, day_of_week").eq("date", date).single();
    if (!briefing) { lines.push(`${date}: NOT FOUND`); continue; }

    const { data: items } = await supabase.from("briefing_items")
      .select("id, title, category, image_url, image_source, title_es, title_gl, metadata_spotify_track_id")
      .eq("briefing_id", briefing.id);

    if (!items) { lines.push(`${date}: NO ITEMS`); continue; }

    const withImg = items.filter(i => i.image_url).length;
    const withEs = items.filter(i => i.title_es).length;
    const withGl = items.filter(i => i.title_gl).length;
    const withMusic = items.filter(i => i.metadata_spotify_track_id).length;
    const editorial = items.filter(i => !i.category.startsWith("viral_")).length;
    const viral = items.filter(i => i.category.startsWith("viral_")).length;
    const categories = [...new Set(items.map(i => i.category))];

    lines.push(`== ${date} (${briefing.day_of_week}) == ${items.length} cards ==`);
    lines.push(`   Editorial: ${editorial} | Viral: ${viral}`);
    lines.push(`   Images: ${withImg}/${items.length} | ES: ${withEs} | GL: ${withGl} | Music: ${withMusic}`);
    lines.push(`   Categories: ${categories.join(", ")}`);
    
    const musicCards = items.filter(i => i.category === "music" || i.category === "viral_music");
    for (const mc of musicCards) {
      lines.push(`   MUSIC: ${mc.title} [${mc.category}] ${mc.metadata_spotify_track_id ? "HAS_YT" : "NO_YT"}`);
    }
    lines.push("");
  }

  const output = lines.join("\n");
  writeFileSync("C:\\Users\\34646\\.gemini\\antigravity\\scratch\\hoxe\\audit_result.txt", output, "utf-8");
  console.log("Written to audit_result.txt");
}

main().catch(console.error);
