import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Direct Wikipedia thumbnail URLs for curated picks (2-3 per day)
// These are stable Wikimedia Commons paths
const IMAGE_MAP: Record<string, { search: string; url: string }[]> = {
  "May 1": [
    { search: "Empire State Building", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg" },
    { search: "Citizen Kane", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Citizen_Kane_poster%2C_1941_%28Style_B%2C_unrestored%29.jpg/400px-Citizen_Kane_poster%2C_1941_%28Style_B%2C_unrestored%29.jpg" },
    { search: "U 2 Incident", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/U-2_Dragonlady.jpg/800px-U-2_Dragonlady.jpg" },
  ],
  "May 2": [
    { search: "Leonardo Da Vinci", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Leonardo_da_Vinci_-_presumed_self-portrait_-_WGA12798.jpg/400px-Leonardo_da_Vinci_-_presumed_self-portrait_-_WGA12798.jpg" },
    { search: "Berlin Surrenders", url: "https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Raising_a_Flag_over_the_Reichstag_%28original%29.jpg/400px-Raising_a_Flag_over_the_Reichstag_%28original%29.jpg" },
    { search: "Lou Gehrig", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Lou_Gehrig_and_Babe_Ruth_-_adjusted.jpg/400px-Lou_Gehrig_and_Babe_Ruth_-_adjusted.jpg" },
  ],
  "May 3": [
    { search: "Margaret Thatcher", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Margaret_Thatcher_stock_portrait_%28cropped%29.jpg/400px-Margaret_Thatcher_stock_portrait_%28cropped%29.jpg" },
    { search: "Anne Frank House", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Anne_Frank_House_Bookcase.jpg/400px-Anne_Frank_House_Bookcase.jpg" },
    { search: "Constitution Of May 3", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Constitution_of_May_3%2C_1791_by_Jan_Matejko.PNG/800px-Constitution_of_May_3%2C_1791_by_Jan_Matejko.PNG" },
  ],
  "May 4": [
    { search: "Audrey Hepburn", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Audrey_Hepburn_1956.jpg/400px-Audrey_Hepburn_1956.jpg" },
    { search: "Kent State", url: "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Kent_State_massacre.jpg/400px-Kent_State_massacre.jpg" },
    { search: "May Fourth Movement", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/4_May_1919_in_Shanghai.jpg/800px-4_May_1919_in_Shanghai.jpg" },
  ],
  "May 5": [
    { search: "Karl Marx", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Karl_Marx_001.jpg/400px-Karl_Marx_001.jpg" },
    { search: "Alan Shepard", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Alan_Shepard_in_Mercury_flight_suit.jpg/400px-Alan_Shepard_in_Mercury_flight_suit.jpg" },
    { search: "Napoleon Dies", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project_2.jpg/400px-Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project_2.jpg" },
  ],
  "May 6": [
    { search: "Hindenburg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Hindenburg_disaster.jpg/800px-Hindenburg_disaster.jpg" },
    { search: "Roger Bannister", url: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Roger_Bannister_after_setting_the_world_mile_record.jpg/400px-Roger_Bannister_after_setting_the_world_mile_record.jpg" },
    { search: "Channel Tunnel", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Channel_Tunnel_NordPasdeCalais.jpg/800px-Channel_Tunnel_NordPasdeCalais.jpg" },
  ],
  "May 7": [
    { search: "Lusitania", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Lusitania_Memorabilia_-_Flickr_-_The_Central_Intelligence_Agency.jpg/400px-Lusitania_Memorabilia_-_Flickr_-_The_Central_Intelligence_Agency.jpg" },
    { search: "Beethoven", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Beethoven.jpg/400px-Beethoven.jpg" },
    { search: "Germany Signs Surrender", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Bundesarchiv_Bild_146-1990-048-11%2C_Reims%2C_Kapitulation.jpg/800px-Bundesarchiv_Bild_146-1990-048-11%2C_Reims%2C_Kapitulation.jpg" },
  ],
  "May 8": [
    { search: "Victory In Europe", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Ve_Day_Celebrations_in_London%2C_8_May_1945.jpg/400px-Ve_Day_Celebrations_in_London%2C_8_May_1945.jpg" },
    { search: "Let It Be", url: "https://upload.wikimedia.org/wikipedia/en/thumb/2/25/LetItBe.jpg/400px-LetItBe.jpg" },
    { search: "Mount Pel", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Pelee_1902.jpg/400px-Pelee_1902.jpg" },
  ],
  "May 9": [
    { search: "Aldo Moro", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Moro3.jpg/400px-Moro3.jpg" },
    { search: "Billy Joel", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Billy_Joel_-_Perth_7_November_2006.jpg/400px-Billy_Joel_-_Perth_7_November_2006.jpg" },
    { search: "Crown Jewels", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tower_of_london_from_swissre.jpg/400px-Tower_of_london_from_swissre.jpg" },
  ],
  "May 10": [
    { search: "Nelson Mandela", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Nelson_Mandela-2008_%28edit%29.jpg/400px-Nelson_Mandela-2008_%28edit%29.jpg" },
    { search: "Richard Feynman", url: "https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Richard_Feynman_Nobel.jpg/400px-Richard_Feynman_Nobel.jpg" },
    { search: "Transcontinental Railroad", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/East_and_West_Shaking_hands_at_the_laying_of_last_rail_Union_Pacific_Railroad_-_Restoration.jpg/800px-East_and_West_Shaking_hands_at_the_laying_of_last_rail_Union_Pacific_Railroad_-_Restoration.jpg" },
  ],
  "May 11": [
    { search: "Bob Marley", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Bob-Marley-in-Concert_Zurich_05-30-80.jpg/400px-Bob-Marley-in-Concert_Zurich_05-30-80.jpg" },
    { search: "Salvador Dal", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Salvador_Dal%C3%AD_1939.jpg/400px-Salvador_Dal%C3%AD_1939.jpg" },
    { search: "Deep Blue", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Deep_Blue.jpg/400px-Deep_Blue.jpg" },
  ],
  "May 12": [
    { search: "Florence Nightingale", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Florence_Nightingale_%28H_Hering_NPG_x82368%29.jpg/400px-Florence_Nightingale_%28H_Hering_NPG_x82368%29.jpg" },
    { search: "Katharine Hepburn", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Katharine_Hepburn_promo_pic.jpg/400px-Katharine_Hepburn_promo_pic.jpg" },
  ],
  "May 13": [
    { search: "Stevie Wonder", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Stevie_Wonder_1973.JPG/400px-Stevie_Wonder_1973.JPG" },
    { search: "Churchill", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Sir_Winston_Churchill_-_19086236948.jpg/400px-Sir_Winston_Churchill_-_19086236948.jpg" },
  ],
  "May 14": [
    { search: "Israel Declares", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Declaration_of_State_of_Israel_1948.jpg/800px-Declaration_of_State_of_Israel_1948.jpg" },
    { search: "Frank Sinatra", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Frank_Sinatra_%2757.jpg/400px-Frank_Sinatra_%2757.jpg" },
    { search: "Skylab", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Skylab_%28SL-4%29.jpg/400px-Skylab_%28SL-4%29.jpg" },
  ],
  "May 15": [
    { search: "Emily Dickinson", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Emily_Dickinson_daguerreotype.jpg/400px-Emily_Dickinson_daguerreotype.jpg" },
    { search: "Pierre Curie", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Pierre_Curie_by_Dujardin_c1906.jpg/400px-Pierre_Curie_by_Dujardin_c1906.jpg" },
    { search: "Mickey Mouse", url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Mickey_Mouse.png/400px-Mickey_Mouse.png" },
  ],
  "May 16": [
    { search: "Warsaw Ghetto", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Stroop_Report_-_Warsaw_Ghetto_Uprising_06b.jpg/400px-Stroop_Report_-_Warsaw_Ghetto_Uprising_06b.jpg" },
    { search: "Top Gun", url: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Top_Gun_%281986%29_theatrical_poster.jpg/400px-Top_Gun_%281986%29_theatrical_poster.jpg" },
    { search: "Pet Sounds", url: "https://upload.wikimedia.org/wikipedia/en/thumb/b/bb/PetSoundsCover.jpg/400px-PetSoundsCover.jpg" },
  ],
  "May 17": [
    { search: "Brown V. Board", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Brown_v._Board_of_Education_National_Historic_Site.jpg/800px-Brown_v._Board_of_Education_National_Historic_Site.jpg" },
    { search: "Kentucky Derby", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Churchill_Downs_from_Central_Avenue.jpg/800px-Churchill_Downs_from_Central_Avenue.jpg" },
    { search: "Wizard Of Oz", url: "https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Wizard_oz_1903_poster.jpg/400px-Wizard_oz_1903_poster.jpg" },
  ],
};

async function main() {
  for (const [date, images] of Object.entries(IMAGE_MAP)) {
    console.log(`\n══ ${date} ══`);
    
    const { data: briefing } = await supabase.from("daily_briefings").select("id").eq("date", date).single();
    if (!briefing) { console.log("  NOT FOUND"); continue; }
    
    const { data: items } = await supabase.from("briefing_items")
      .select("id, title")
      .eq("briefing_id", briefing.id);
    
    if (!items) continue;
    
    for (const img of images) {
      const match = items.find(it => it.title.toLowerCase().includes(img.search.toLowerCase()));
      if (match) {
        await supabase.from("briefing_items").update({
          image_url: img.url,
          image_source: "Auto-Hunt: Wikipedia"
        }).eq("id", match.id);
        console.log(`  ✅ ${match.title.substring(0, 50)} → image set`);
      } else {
        console.log(`  ❌ No match for "${img.search}"`);
      }
    }
  }
  
  console.log("\n✅ Done. Curated Wikipedia images set for May 1–17.");
}

main().catch(console.error);
