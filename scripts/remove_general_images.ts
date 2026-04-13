import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("=== SELECTIVE IMAGE ENFORCER (MAX 3 SPECIFIC IMAGES PER DAY) ===");

  // 1. Get all days
  const { data: days, error: daysErr } = await supabase.from("daily_briefings").select("id, date");
  if (daysErr || !days) {
    console.error("Failed to load days:", daysErr);
    return;
  }

  for (const day of days) {
    console.log(`\nProcessing: ${day.date}...`);

    // 2. Get all items for this day
    const { data: items, error: itemsErr } = await supabase
      .from("briefing_items")
      .select("id, image_url, image_source, category, title")
      .eq("briefing_id", day.id);

    if (itemsErr || !items) {
      console.error("Failed to load items:", itemsErr);
      continue;
    }

    // 3. Separate the good specific images (Wikipedia) from the generic (Unsplash)
    const specificImageItems = items.filter(
      i => i.image_url && i.image_source === "Wikipedia" && !i.image_url.includes("unsplash.com")
    );
    const otherItems = items.filter(
      i => !specificImageItems.includes(i)
    );

    console.log(` - Found ${specificImageItems.length} personalized Wikipedia images.`);
    console.log(` - Found ${otherItems.length} generic/no-image items.`);

    // 4. Select at most 3 personalized images
    // We can prioritize by shuffling or preferring certain categories, but let's just pick the first 3
    // Or prefer ones that aren't viral_moment.
    const keepImages = specificImageItems.sort(() => 0.5 - Math.random()).slice(0, 3);
    const dropImages = specificImageItems.filter(i => !keepImages.includes(i));

    // Items that must have their images NULLIFIED:
    // This includes any Unsplash images AND Wikipedia images that exceeded the daily limit of 3
    const idsToClear = [...otherItems.filter(i => i.image_url), ...dropImages].map(i => i.id);

    if (idsToClear.length > 0) {
      const { error: updateErr } = await supabase
        .from("briefing_items")
        .update({ image_url: null, image_source: null })
        .in("id", idsToClear);

      if (updateErr) {
        console.error(" ❌ Failed to wipe images:", updateErr);
      } else {
        console.log(` ✅ Wiped generic or overflow images from ${idsToClear.length} cards.`);
      }
    } else {
      console.log(` ✅ No dummy images to clear.`);
    }

    keepImages.forEach(i => {
      console.log(`   ✨ Kept Image for: [${i.category}] ${i.title.substring(0, 40)}`);
    });
  }
}

main().catch(console.error);
