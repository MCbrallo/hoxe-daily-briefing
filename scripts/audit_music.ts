import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: days } = await s.from("daily_briefings").select("id, date").order("id", { ascending: true });
  if (!days) return;

  const missingDays: string[] = [];

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
      missingDays.push(day.date);
    }
  }

  if (missingDays.length > 0) {
    console.log("❌ The following days are MISSING a music card:");
    missingDays.forEach(d => console.log(`   - ${d}`));
  } else {
    console.log("✅ ALL DAYS have at least one valid Spotify music card!");
  }
}
run();
