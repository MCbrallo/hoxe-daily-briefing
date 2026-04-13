const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('daily_briefings').select('date, briefing_items(title, short_explanation, why_it_matters, category, metadata_spotify_track_id)').eq('date', 'May 15').single();
  if(data) {
    const items = data.briefing_items.slice(0, 3);
    const result = items.map((i) => ({
      title: i.title,
      category: i.category,
      short_explanation_length: i.short_explanation?.length || 0,
      short_explanation_preview: i.short_explanation?.substring(0, 200),
      why_it_matters_length: i.why_it_matters?.length || 0,
      why_it_matters_preview: i.why_it_matters?.substring(0, 200),
      has_spotify: !!i.metadata_spotify_track_id
    }));
    fs.writeFileSync('C:/tmp/may15_check.json', JSON.stringify(result, null, 2));
    console.log("DONE");
  } else {
    console.log("No data for May 15");
  }
}
run();
