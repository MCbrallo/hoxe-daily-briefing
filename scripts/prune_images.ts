import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("Fetching all dates...");
  const { data: days } = await supabase.from("daily_briefings").select("id, date");
  
  if (!days) return;

  for (const day of days) {
    console.log(`\nProcessing ${day.date} (${day.id})`);
    
    // Get all items for this day
    const { data: items } = await supabase
      .from("briefing_items")
      .select("id, category, image_url, title")
      .eq("briefing_id", day.id)
      .neq("image_url", null)
      .order("id"); // Deterministic
      
    if (!items) continue;
    
    console.log(`  Found ${items.length} items with images`);
    
    if (items.length > 3) {
      // Pick first 3. Could do random, but first 3 is fine for deterministic tests.
      // Wait, let's pick 3 that look visually appealing like space, art, viral.
      const priorityCats = ["viral_moment", "viral_movie", "space", "art and architecture", "science", "history"];
      
      let kept = items.filter(i => priorityCats.includes(i.category.toLowerCase()));
      if (kept.length > 3) kept = kept.slice(0, 3);
      if (kept.length < 3) {
         // fill up to 3 from the rest
         const others = items.filter(i => !kept.some(k => k.id === i.id));
         kept = [...kept, ...others.slice(0, 3 - kept.length)];
      }
      
      const keptIds = kept.map(k => k.id);
      const toRemove = items.filter(i => !keptIds.includes(i.id));
      
      console.log(`  Keeping 3 images for: ${kept.map(k => k.title).join(", ")}`);
      console.log(`  Removing images for ${toRemove.length} cards`);
      
      for (const item of toRemove) {
        await supabase
          .from("briefing_items")
          .update({ image_url: null, image_source: null })
          .eq("id", item.id);
      }
    } else {
      console.log(`  Day already has ${items.length} <= 3 images. No prune needed.`);
    }
  }
  
  console.log("\nDone pruning images!");
}

main().catch(console.error);
