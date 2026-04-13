/**
 * HOXE — CURATED IMAGE PATCH: May 18–24
 * 
 * Replaces auto-resolved images with handpicked, iconic
 * Wikimedia Commons thumbnails for 2-3 key cards per day.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IMAGE_MAP: Record<string, { search: string; url: string }[]> = {
  // ═══════════════════════════════════════════════
  //  MAY 18
  // ═══════════════════════════════════════════════
  "May 18": [
    {
      search: "Mount St. Helens",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/MSH80_eruption_mount_st_helens_05-18-80-dramatic-702x702.jpg/800px-MSH80_eruption_mount_st_helens_05-18-80-dramatic-702x702.jpg"
    },
    {
      search: "John Paul II",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Pope_John_Paul_II_on_12_August_1993_in_Denver_%28Colorado%29.jpg/400px-Pope_John_Paul_II_on_12_August_1993_in_Denver_%28Colorado%29.jpg"
    },
    {
      search: "Vasco Da Gama",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Vasco_da_Gama_%28without_samples%29.jpg/400px-Vasco_da_Gama_%28without_samples%29.jpg"
    },
  ],

  // ═══════════════════════════════════════════════
  //  MAY 19
  // ═══════════════════════════════════════════════
  "May 19": [
    {
      search: "Anne Boleyn",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Anne_boleyn.jpg/400px-Anne_boleyn.jpg"
    },
    {
      search: "Lawrence Of Arabia",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/T.E.Lawrence%2C_the_mystery_man_of_Arabia.jpg/400px-T.E.Lawrence%2C_the_mystery_man_of_Arabia.jpg"
    },
    {
      search: "Malcolm X",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Malcolm_X_NYWTS_4.jpg/400px-Malcolm_X_NYWTS_4.jpg"
    },
  ],

  // ═══════════════════════════════════════════════
  //  MAY 20
  // ═══════════════════════════════════════════════
  "May 20": [
    {
      search: "Amelia Earhart",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Amelia_Earhart_standing_under_nose_of_her_Lockheed_Model_10-E_Electra%2C_small.jpg/400px-Amelia_Earhart_standing_under_nose_of_her_Lockheed_Model_10-E_Electra%2C_small.jpg"
    },
    {
      search: "Lindbergh",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Charles_Lindbergh_and_the_Spirit_of_St._Louis_%28Crisco_restoration%2C_with_background_removed%29.jpg/400px-Charles_Lindbergh_and_the_Spirit_of_St._Louis_%28Crisco_restoration%2C_with_background_removed%29.jpg"
    },
    {
      search: "Cher",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Cher_in_2019_%28cropped%29.jpg/400px-Cher_in_2019_%28cropped%29.jpg"
    },
  ],

  // ═══════════════════════════════════════════════
  //  MAY 21
  // ═══════════════════════════════════════════════
  "May 21": [
    {
      search: "Spirit Of St. Louis",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Spirit_of_St._Louis.jpg/800px-Spirit_of_St._Louis.jpg"
    },
    {
      search: "Red Cross",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Henry_Dunant-young.jpg/400px-Henry_Dunant-young.jpg"
    },
    {
      search: "Rajiv Gandhi",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Rajiv_Gandhi_%28cropped%29.jpg/400px-Rajiv_Gandhi_%28cropped%29.jpg"
    },
  ],

  // ═══════════════════════════════════════════════
  //  MAY 22
  // ═══════════════════════════════════════════════
  "May 22": [
    {
      search: "Richard Wagner",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/RichardWagner.jpg/400px-RichardWagner.jpg"
    },
    {
      search: "Pac-Man",
      url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Pac-man.png/400px-Pac-man.png"
    },
    {
      search: "Arthur Conan Doyle",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Arthur_Conan_Doyle_by_Walter_Benington%2C_1914.png/400px-Arthur_Conan_Doyle_by_Walter_Benington%2C_1914.png"
    },
  ],

  // ═══════════════════════════════════════════════
  //  MAY 23
  // ═══════════════════════════════════════════════
  "May 23": [
    {
      search: "Bonnie And Clyde",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/BonnieParkerClydBarrowDallas.jpg/400px-BonnieParkerClydBarrowDallas.jpg"
    },
    {
      search: "Joan Of Arc",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Joan_of_Arc_miniature_graded.jpg/400px-Joan_of_Arc_miniature_graded.jpg"
    },
    {
      search: "Rosemary",
      url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Rosemarys_baby_poster.jpg/400px-Rosemarys_baby_poster.jpg"
    },
  ],

  // ═══════════════════════════════════════════════
  //  MAY 24
  // ═══════════════════════════════════════════════
  "May 24": [
    {
      search: "Brooklyn Bridge",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Brooklyn_Bridge_Postdlf.jpg/800px-Brooklyn_Bridge_Postdlf.jpg"
    },
    {
      search: "Bob Dylan",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Bob_Dylan_-_Azkena_Rock_Festival_2010_2.jpg/400px-Bob_Dylan_-_Azkena_Rock_Festival_2010_2.jpg"
    },
    {
      search: "Queen Victoria",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Queen_Victoria_by_Bassano.jpg/400px-Queen_Victoria_by_Bassano.jpg"
    },
  ],
};

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  HOXE — Curated Images for May 18–24           ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  let totalSet = 0;
  let totalMissed = 0;

  for (const [date, images] of Object.entries(IMAGE_MAP)) {
    console.log(`\n══ ${date} ══`);

    const { data: briefing } = await supabase
      .from("daily_briefings")
      .select("id")
      .eq("date", date)
      .single();

    if (!briefing) {
      console.log("  ❌ Day NOT FOUND in DB — run import_may_18_24 first");
      continue;
    }

    const { data: items } = await supabase
      .from("briefing_items")
      .select("id, title")
      .eq("briefing_id", briefing.id);

    if (!items) continue;

    for (const img of images) {
      const match = items.find(
        (it) => it.title.toLowerCase().includes(img.search.toLowerCase())
      );
      if (match) {
        await supabase
          .from("briefing_items")
          .update({
            image_url: img.url,
            image_source: "Auto-Hunt: Wikipedia",
          })
          .eq("id", match.id);
        console.log(`  ✅ ${match.title.substring(0, 55)} → image set`);
        totalSet++;
      } else {
        console.log(`  ❌ No match for "${img.search}"`);
        totalMissed++;
      }
    }
  }

  console.log(`\n══ SUMMARY ══`);
  console.log(`  ✅ Images set: ${totalSet}`);
  console.log(`  ❌ Missed: ${totalMissed}`);
  console.log(`\n✅ Done. Curated Wikipedia images set for May 18–24.`);
}

main().catch(console.error);
