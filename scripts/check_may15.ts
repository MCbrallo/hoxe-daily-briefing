import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(url, key)

const { data } = await supabase.from('daily_briefings').select('date, briefing_items(title, short_explanation, why_it_matters, category, metadata_spotify_track_id)').eq('date', 'May 15').single()
if(data) {
  const items = data.briefing_items.slice(0, 3)
  for (const i of items) {
    console.log(`--- ${i.title} ---`)
    console.log(`category: ${i.category}`)
    console.log(`short_explanation (${(i.short_explanation||'').length} chars): ${(i.short_explanation||'').substring(0, 150)}`)
    console.log(`why_it_matters (${(i.why_it_matters||'').length} chars): ${(i.why_it_matters||'').substring(0, 100)}`)
    console.log(`spotify: ${!!i.metadata_spotify_track_id}`)
    console.log('')
  }
} else {
  console.log("No data for May 15")
}
