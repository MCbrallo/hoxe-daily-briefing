import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const dates = ["April 14", "April 20", "April 26", "May 4", "May 10"];
  for (const d of dates) {
    const { data } = await supabase.from('daily_briefings').select('date, briefing_items(category, short_explanation, why_it_matters_es, metadata_spotify_track_id)').eq('date', d).single();
    if(data) {
      console.log(`\n=== ${d} ===`);
      const viralCount = data.briefing_items.filter(i => i.category?.startsWith("viral")).length;
      const dailyCount = data.briefing_items.filter(i => !i.category?.startsWith("viral")).length;
      const validSubtitles = data.briefing_items.filter(i => i.short_explanation?.length > 5 && i.short_explanation?.length < 150).length;
      const esCount = data.briefing_items.filter(i => i.why_it_matters_es?.length > 0).length;
      const musicCount = data.briefing_items.filter(i => i.metadata_spotify_track_id?.length > 5).length;
      console.log(`Daily: ${dailyCount} | Viral: ${viralCount}`);
      console.log(`Valid Subtitles: ${validSubtitles}/${data.briefing_items.length}`);
      console.log(`Spanish Translations: ${esCount}/${data.briefing_items.length}`);
      console.log(`Spotify Cards: ${musicCount}`);
    } else {
      console.log(`\n=== ${d} === NO DATA YET`);
    }
  }
}
run();
