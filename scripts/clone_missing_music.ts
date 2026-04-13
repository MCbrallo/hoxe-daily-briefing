import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  console.log("=== CLONING EXISTING MUSIC CARDS FOR MISSING DAYS ===");
  const { data: days } = await s.from("daily_briefings").select("id, date").order("id", { ascending: true });
  if (!days) return;

  const missingDays: {id:number, date:string}[] = [];
  
  // 1. Identify missing days
  for (const day of days) {
    const { data: items } = await s.from("briefing_items").select("id, metadata_spotify_track_id, category").eq("briefing_id", day.id);
    let hasMusic = false;
    for (const item of items || []) {
      if ((item.category === "music" || item.category === "viral_music") && item.metadata_spotify_track_id) {
        hasMusic = true;
        break;
      }
    }
    if (!hasMusic) {
      missingDays.push({ id: day.id, date: day.date });
    }
  }

  console.log(`Found ${missingDays.length} days missing a valid music card.`);
  if (missingDays.length === 0) return;

  // 2. Fetch all valid music cards
  const { data: validMusics } = await s.from("briefing_items")
    .select("category, title, short_explanation, why_it_matters, year, image_url, metadata_spotify_track_id, language")
    .in("category", ["music", "viral_music"])
    .not("metadata_spotify_track_id", "is", null);

  if (!validMusics || validMusics.length === 0) {
    console.log("No valid source music cards found in DB to clone from!");
    return;
  }

  console.log(`Found ${validMusics.length} valid music templates to clone. Building pool...`);

  validMusics.sort(() => 0.5 - Math.random());
  
  let poolIdx = 0;
  let injected = 0;

  // 3. Inject
  for (const day of missingDays) {
    const sourceCard = validMusics[poolIdx % validMusics.length];
    poolIdx++;

    const payload = {
      briefing_id: day.id,
      app_date: day.date,
      event_date: `${sourceCard.year}`,
      year: sourceCard.year,
      category: "music",
      title: sourceCard.title,
      short_explanation: sourceCard.short_explanation || "A defining moment in musical history.",
      why_it_matters: sourceCard.why_it_matters,
      image_url: sourceCard.image_url,
      metadata_spotify_track_id: sourceCard.metadata_spotify_track_id,
      language: sourceCard.language || 'en'
    };

    const { error } = await s.from("briefing_items").insert(payload);

    if (error) {
      console.log(`❌ DB Error for ${day.date}: ${error.message}`);
    } else {
      console.log(`✅ Injected "${sourceCard.title}" into ${day.date}`);
      injected++;
    }
  }
  
  console.log(`\nSuccessfully injected ${injected} music cards! Every day now has music.`);
}
run();
