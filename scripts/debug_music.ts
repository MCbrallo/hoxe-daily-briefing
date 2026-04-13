import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data } = await s.from('briefing_items').select('app_date, title, category, metadata_spotify_track_id');
  if (!data) return;

  const musicCards = data.filter(c => c.category === 'music');
  
  const april13 = data.filter(c => c.app_date === 'April 13');
  console.log('--- April 13 Cards ---');
  april13.forEach(c => console.log(`[${c.category}] ${c.title}`));
  
  const daysWithMusic = new Set(musicCards.map(c => c.app_date));
  const uniqueDays = new Set(data.filter(c=>c.category==='history').map(c => c.app_date));
  
  console.log(`\nTotal days: ${uniqueDays.size}`);
  console.log(`Days with a music category natively: ${daysWithMusic.size}`);
  
  const missing = [...uniqueDays].filter(d => !daysWithMusic.has(d));
  console.log(`\nDays MISSING the music category:`);
  console.log(missing.join(', '));
}

run();
