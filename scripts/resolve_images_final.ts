/**
 * HOXE IMAGE RESOLVER — FINAL PASS
 * 
 * Direct Wikipedia article URL lookups + hardcoded known-good images for 
 * the remaining ~39 cards that Wikipedia's search and REST APIs couldn't resolve.
 * Uses the MediaWiki action API with exact page titles for reliable results.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Direct Wikipedia page title → card ID mapping for exact image resolution
const EXACT_PAGES: Record<string, string> = {
  "2f55ee0f-8c71-448e-8ea3-4e76f3d78fbc": "London_Marathon",
  "6d6fc4ce-b61d-47ed-a1f9-75cef53b1c90": "1992_Guadalajara_explosions",
  "72cb793e-a328-4e8d-80bb-daf6121e3624": "Lego_minifigure",
  "ff748adc-d9d5-4a6e-b554-71fb8b99686a": "Carnation_Revolution",
  "c1ea3120-9f53-4436-9636-89af000c3730": "Felix_Klein",
  "b6fa403d-9282-475f-a3a8-69f51949b83d": "Marc_Isambard_Brunel",
  "1cd0d7a9-ebe8-4084-b7c7-515d73a52929": "Molecular_Structure_of_Nucleic_Acids:_A_Structure_for_Deoxyribose_Nucleic_Acid",
  "b7a66911-ea91-468b-bf69-d84a74bd8400": "Anders_Celsius",
  "69ac4d3f-57f8-4377-a582-ee0d563a67d3": "Gallipoli_campaign",
  "f4f98d49-f175-42c0-ac85-fbd972d46fdd": "Battle_of_Marks%27_Mills",
  "03619a6a-826b-40e2-b847-a440454c57e3": "La_Marseillaise",
  "0b87bb6a-bdb5-4f07-b034-c4e578e3d355": "Solar_cell",
  "498ea3bc-9622-40f7-bf4e-5cd4147d657f": "Pioneer_10",
  "8b9ad076-2807-4eb8-8a01-c90b9764552c": "Violeta_Chamorro",
  "261c3119-80a0-4689-9ee6-fc9f9b63b902": "Anzac_Day",
  "1dd1981b-ba8e-4c5a-963f-14e0f873bb2f": "USS_Triton_(SSRN-586)",
  "015949f3-74c0-4fc8-a255-193951ac7636": "Erie_Railroad_Co._v._Tompkins",
  "f48cac9b-1d6c-4cfa-b596-f91b86810e73": "Robert_Noyce",
  "9c23c2b5-d0f4-4417-b39a-bc2a570743dd": "April_2015_Nepal_earthquake",
  "53c67dcc-fae8-48cd-b16a-1282c06c6b44": "Leon_Battista_Alberti",
  "75fa25fe-c773-4435-988b-784a980f9e2e": "Thornton_Affair",
  "e1bc43fb-cd3d-44ef-b500-90474148d59c": "Stand-up_comedy",
  "da3f6099-781b-4eb6-aafe-737bcfa922a5": "Relay_race",
  "dae1067c-1fb0-40a7-b43a-cf17549c4ea0": "Alex_Warren",
  "6f6a1cf0-2843-42ed-a28c-929944c29ff8": "Petrarch",
  "cd02f369-9b06-40b3-bd73-599285568a0a": "Cape_Henry",
  "6e1afab2-7c66-41c5-a69b-eb356635d326": "Tanzania",
  "da09d8ee-28f3-4211-afea-1e2efa1fdda8": "Geneva_Conference_(1954)",
  "f1412a70-a41c-4f81-91ae-b5fa099fed5e": "Arno_Allan_Penzias",
  "f8584e49-c2f9-435d-b9f1-a03cdd28a94a": "Michael_Smith_(biochemist)",
  "6ea7f7af-4fff-4453-8e58-609dededd914": "Arnold_Sommerfeld",
  "67cde7c5-c3af-485b-b547-11ee6fdc0bcf": "Battle_of_Derna_(1805)",
  "a286e18c-82be-45d6-8096-77b7ff269b33": "Guernica_(Picasso)",
  "7a072c5e-b8ea-4c9a-93ca-5ca1d4c5c227": "Count_Basie",
  "aa6fed03-3901-4a89-93e2-cd7b0a2aa30b": "Containerization",
  "e49ae614-9c71-4995-94a8-70eeb3ba924c": "Chernobyl_disaster",
  "cdd47a8f-8252-46e2-9454-7d433ba1e3d4": "Ice_hockey_at_the_Olympic_Games",
  "4e33f9a9-572d-40e4-b6c4-93d4a0b7eb24": "1966_Tashkent_earthquake",
  "6b151878-fe28-48bd-af6d-d6acf0608fdb": "Gestapo",
  "39956df6-705f-426d-a1ea-40f90b33ba18": "World_Intellectual_Property_Organization",
  "6cf226bf-0ae4-4b92-811d-cb3bbe086e37": "Bill_Cosby",
  "e21c0cfd-c75d-4efb-880c-df69d559abda": "Competitive_eating",
  "39572072-83ba-4e97-92fa-8f795248990f": "Taco",
  "479bbfd2-c11f-4155-a4bf-8563d2cdd63e": "Taylor_Swift",
};

async function getWikiPageImage(pageTitle: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    
    // Use the action API with pageimages to get the main image
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&format=json&origin=*`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HoxeImageResolver/3.0 (contact: dev@hoxe.app)' },
      signal: ctrl.signal
    });
    clearTimeout(t);
    
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const p of Object.values(pages) as any[]) {
          if (p.original?.source) return p.original.source;
          if (p.thumbnail?.source) return p.thumbnail.source;
        }
      }
    }
  } catch (e) {
    console.error(`   fetch error for ${pageTitle}:`, (e as any).message);
  }
  return null;
}

async function main() {
  const stillFailed: any[] = JSON.parse(fs.readFileSync("tmp_still_failed.json", "utf-8"));
  
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  HOXE IMAGE RESOLVER — FINAL PASS (Direct Page Lookups)     ║");
  console.log(`║  Processing ${stillFailed.length} remaining cards with exact Wikipedia pages    ║`);
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  let fixed = 0;
  let remaining: string[] = [];

  for (const card of stillFailed) {
    const pageTitle = EXACT_PAGES[card.id];
    
    process.stdout.write(`  ${card.title.substring(0, 52).padEnd(52)} `);

    if (!pageTitle) {
      console.log(`⚠️  NO MAPPING`);
      remaining.push(card.title);
      continue;
    }

    const imgUrl = await getWikiPageImage(pageTitle);
    
    if (imgUrl) {
      await supabase
        .from("briefing_items")
        .update({ image_url: imgUrl, image_source: "Wikipedia" })
        .eq("id", card.id);
      fixed++;
      console.log(`✅ [${pageTitle}]`);
    } else {
      remaining.push(card.title);
      console.log(`❌ [${pageTitle}] — no image on page`);
    }

    // Rate limit: 1 request per second to be respectful
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n═══ FINAL PASS RESULTS ═══`);
  console.log(`Fixed: ${fixed}/${stillFailed.length}`);
  console.log(`Still missing: ${remaining.length}`);
  if (remaining.length > 0) {
    console.log(`\nRemaining:`);
    for (const t of remaining) console.log(`  - ${t}`);
  }
}

main().catch(console.error);
