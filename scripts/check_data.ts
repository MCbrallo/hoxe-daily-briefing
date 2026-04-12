import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ikmhbhvwjgzrylingkaq.supabase.co";
const supabaseKey = "sb_publishable_yJ4H7fSDx6XHBgdb27hrfw_YINAOcfy";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
  console.log(`\nChecking for: "${today}"\n`);
  
  const { data: briefing } = await supabase
    .from("daily_briefings")
    .select("*, briefing_items(*)")
    .eq("date", today)
    .limit(1)
    .single();

  if (!briefing) {
    console.log("No briefing found for today!");
    const { data: all } = await supabase
      .from("daily_briefings")
      .select("date, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    console.log("\nAvailable dates:", all?.map(r => r.date));
    return;
  }

  console.log(`Briefing: ${briefing.date} (${briefing.day_of_week})`);
  console.log(`Total items: ${briefing.briefing_items.length}`);
  
  const cats: Record<string, number> = {};
  for (const item of briefing.briefing_items) {
    cats[item.category] = (cats[item.category] || 0) + 1;
  }
  console.log("\nCategory breakdown:");
  for (const [cat, count] of Object.entries(cats).sort()) {
    const sample = briefing.briefing_items.find((i: any) => i.category === cat);
    const hasImg = sample?.image_url ? "img" : "NO-img";
    const hasSpotify = sample?.metadata_spotify_track_id ? " spotify" : "";
    console.log(`  ${cat}: ${count} items (${hasImg})${hasSpotify}`);
  }

  const viralCount = briefing.briefing_items.filter((i: any) => i.category.startsWith("viral_")).length;
  console.log(`\nViral total: ${viralCount}/5`);
  const editorialCount = briefing.briefing_items.filter((i: any) => !i.category.startsWith("viral_")).length;
  console.log(`Editorial total: ${editorialCount}`);
  
  const musicItems = briefing.briefing_items.filter((i: any) => i.category === "music");
  console.log(`Music items: ${musicItems.length}`);
  for (const m of musicItems) {
    console.log(`  "${m.title}" spotify=${m.metadata_spotify_track_id || "NONE"}`);
  }
}

check();
