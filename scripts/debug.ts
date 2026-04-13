import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data } = await s.from('briefing_items').select('app_date, title, category, metadata_spotify_track_id');
  if (!data) return;

  const out = {
    total: data.length,
    apr13: data.filter(c => c.app_date === "April 13").map(c => ({cat: c.category, title: c.title})),
    musicDates: [...new Set(data.filter(c => c.category === "music").map(c => c.app_date))],
    allDates: [...new Set(data.map(c => c.app_date))]
  };

  fs.writeFileSync("debug.json", JSON.stringify(out, null, 2));
  console.log("Wrote debug.json");
}

run();
