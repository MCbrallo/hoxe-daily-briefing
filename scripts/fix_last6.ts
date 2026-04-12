import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getImg(page: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HoxeBot/3.1 (support@hoxe.app)' }, signal: ctrl.signal });
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
  } catch {}
  return null;
}

// Last 6 cards — try alternative page titles
const FINAL_FIXES: { title: string; pages: string[] }[] = [
  { title: "A Runner Posts The Fastest Marathon Dressed As A Leprechaun", pages: ["London_Marathon", "Marathon_running", "Leprechaun"] },
  { title: "Marks' Mills Becomes A Confederate Victory", pages: ["Battle_of_Marks'_Mills", "Red_River_campaign", "American_Civil_War"] },
  { title: "Erie Overturns A Major Legal Assumption", pages: ["Erie_Railroad_Co._v._Tompkins", "Supreme_Court_of_the_United_States", "Erie_Railroad"] },
  { title: "The Geneva Conference Opens", pages: ["Geneva_Conference_(1954)", "Geneva_Conventions", "Geneva"] },
  { title: "Michael Smith Is Born", pages: ["Michael_Smith_(biochemist)", "Site-directed_mutagenesis", "Nobel_Prize_in_Chemistry"] },
  { title: "Guernica Is Bombed", pages: ["Guernica_(Picasso)", "Bombing_of_Guernica", "Guernica"] },
];

async function main() {
  console.log("=== FINAL 6 FIXES ===\n");

  for (const fix of FINAL_FIXES) {
    process.stdout.write(`  ${fix.title.padEnd(60)} `);
    
    let foundUrl: string | null = null;
    for (const page of fix.pages) {
      foundUrl = await getImg(page);
      if (foundUrl) {
        // Find the card by title match (approximate)
        const { data } = await supabase
          .from("briefing_items")
          .select("id")
          .ilike("title", `%${fix.title.substring(0, 20)}%`)
          .eq("image_source", "Unsplash")
          .limit(1)
          .single();
        
        if (data) {
          await supabase
            .from("briefing_items")
            .update({ image_url: foundUrl, image_source: "Wikipedia" })
            .eq("id", data.id);
          console.log(`✅ [${page}]`);
        } else {
          console.log(`✅ found image but card not matched`);
        }
        break;
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    
    if (!foundUrl) {
      console.log(`❌ all pages failed`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);
