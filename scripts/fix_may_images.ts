import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Curated picks: 2-3 visually iconic cards per day ──
// These will get Wikipedia images; everything else gets image_url = null
const PICKS: Record<string, string[]> = {
  "May 1": [
    "The Empire State Building Is Dedicated",
    "Citizen Kane Premieres",
    "The U 2 Incident Begins",
  ],
  "May 2": [
    "Leonardo Da Vinci Dies",
    "Berlin Surrenders To The Red Army",
    "Lou Gehrig Ends His Streak",
  ],
  "May 3": [
    "Margaret Thatcher Becomes Prime Minister",
    "The Anne Frank House Opens To The Public",
    "Poland Adopts The Constitution Of May 3",
  ],
  "May 4": [
    "Audrey Hepburn Is Born",
    "National Guardsmen Kill Students At Kent State",
    "The May Fourth Movement Begins",
  ],
  "May 5": [
    "Karl Marx Is Born",
    "Alan Shepard Flies Into Space",
    "Napoleon Dies On Saint Helena",
  ],
  "May 6": [
    "The Hindenburg Burns At Lakehurst",
    "Roger Bannister Breaks The Four Minute Barrier",
    "The Channel Tunnel Officially Opens",
  ],
  "May 7": [
    "A U Boat Sinks The Lusitania",
    "Beethoven's Ninth Symphony Premieres",
    "Germany Signs Surrender At Reims",
  ],
  "May 8": [
    "Victory In Europe Day Is Declared",
    "The Beatles Release Let It Be",
    "Mount Pelée Destroys Saint Pierre",
  ],
  "May 9": [
    "Aldo Moro Is Found Dead In Rome",
    "Billy Joel Is Born",
    "Thomas Blood Tries To Steal The Crown Jewels",
  ],
  "May 10": [
    "Nelson Mandela Is Inaugurated President",
    "Richard Feynman Is Born",
    "The Transcontinental Railroad Is Completed",
  ],
  "May 11": [
    "Bob Marley Dies",
    "Salvador Dalí Is Born",
    "Deep Blue Beats Garry Kasparov",
  ],
  "May 12": [
    "Florence Nightingale Is Born",
    "Katharine Hepburn Is Born",
    "Exile On Main St. Is Released",
  ],
  "May 13": [
    "Stevie Wonder Is Born",
    "Churchill Delivers Blood, Toil, Tears And Sweat",
    "Georges Braque Is Born",
  ],
  "May 14": [
    "Israel Declares Statehood",
    "Frank Sinatra Dies",
    "Skylab Is Launched",
  ],
  "May 15": [
    "Emily Dickinson Dies",
    "Pierre Curie Is Born",
    "Mickey Mouse Appears In Plane Crazy",
  ],
  "May 16": [
    "The Warsaw Ghetto Uprising Is Crushed",
    "Top Gun Opens In Theaters",
    "Pet Sounds Is Released",
  ],
  "May 17": [
    "Brown V. Board Is Decided",
    "The First Kentucky Derby Is Run",
    "The Wonderful Wizard Of Oz Is Published",
  ],
};

// Wikipedia image fetcher
async function fetchWikiImage(title: string): Promise<string | null> {
  // Build search terms from the card title
  const cleaned = title
    .replace(/\bIs Born\b/gi, "")
    .replace(/\bIs\b/gi, "")
    .replace(/\bDies\b/gi, "")
    .replace(/\bThe\b/gi, "")
    .replace(/\bA\b/gi, "")
    .replace(/\bAt\b/gi, "")
    .replace(/\bIn\b/gi, "")
    .replace(/\bOf\b/gi, "")
    .replace(/\bAnd\b/gi, "")
    .replace(/\bTo\b/gi, "")
    .replace(/\bOn\b/gi, "")
    .replace(/\bWith\b/gi, "")
    .replace(/\bFor\b/gi, "")
    .replace(/\bBy\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const searchTerms = [cleaned];
  // Also try the most significant noun phrase
  const words = cleaned.split(" ").filter(w => w.length > 2);
  if (words.length > 3) {
    searchTerms.push(words.slice(0, 3).join(" "));
  }

  for (const term of searchTerms) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=3&format=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const results = searchData?.query?.search;
      if (!results || results.length === 0) continue;

      for (const result of results) {
        const pageTitle = result.title;
        const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=800&format=json`;
        const imgRes = await fetch(imgUrl);
        const imgData = await imgRes.json();
        const pages = imgData?.query?.pages;
        if (!pages) continue;
        for (const pid of Object.keys(pages)) {
          const thumb = pages[pid]?.thumbnail?.source;
          if (thumb) return thumb;
        }
      }
    } catch (e) {
      console.log(`  Wiki search error for "${term}":`, e);
    }
  }
  return null;
}

function isPicked(title: string, picks: string[]): boolean {
  const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normTitle = normalizeStr(title);
  return picks.some(p => {
    const normPick = normalizeStr(p);
    // Fuzzy match: check if the core words overlap
    return normTitle.includes(normPick) || normPick.includes(normTitle) ||
      // Word-level match for cases with accent differences
      normPick.split("").filter((_, i) => i < Math.min(normPick.length, normTitle.length) && normPick[i] === normTitle[i]).length > normPick.length * 0.7;
  });
}

async function main() {
  const dates = Object.keys(PICKS);
  
  for (const date of dates) {
    const picks = PICKS[date];
    console.log(`\n══════ ${date} ══════`);
    
    const { data: briefing } = await supabase.from("daily_briefings").select("id").eq("date", date).single();
    if (!briefing) { console.log("  NOT FOUND"); continue; }
    
    const { data: items } = await supabase.from("briefing_items")
      .select("id, title, image_url")
      .eq("briefing_id", briefing.id);
    
    if (!items) continue;
    
    for (const item of items) {
      const picked = isPicked(item.title, picks);
      
      if (picked) {
        // Try to fetch a real Wikipedia image
        console.log(`  📷 PICK: ${item.title.substring(0, 50)}...`);
        const wikiImg = await fetchWikiImage(item.title);
        if (wikiImg) {
          await supabase.from("briefing_items").update({
            image_url: wikiImg,
            image_source: "Auto-Hunt: Wikipedia"
          }).eq("id", item.id);
          console.log(`    ✅ Got Wiki image`);
        } else {
          // Keep null if we can't find one — better than generic
          await supabase.from("briefing_items").update({
            image_url: null,
            image_source: null
          }).eq("id", item.id);
          console.log(`    ⚠️ No Wiki image found — cleared`);
        }
        await new Promise(r => setTimeout(r, 300));
      } else {
        // Not picked — clear the generic image
        if (item.image_url) {
          await supabase.from("briefing_items").update({
            image_url: null,
            image_source: null
          }).eq("id", item.id);
        }
        console.log(`  ⬚ Cleared: ${item.title.substring(0, 50)}`);
      }
    }
  }
  
  console.log("\n✅ Done. May 1–17 images cleaned up.");
}

main().catch(console.error);
