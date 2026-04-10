import { createClient } from "@supabase/supabase-js";
import { april10Briefing } from "../src/lib/mockData";
import dotenv from "dotenv";

// Load .env.local manually
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ikmhbhvwjgzrylingkaq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yJ4H7fSDx6XHBgdb27hrfw_YINAOcfy";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding Supabase Database...");

  // 1. Insert the Briefing Day
  const { data: briefingResult, error: briefingError } = await supabase
    .from("daily_briefings")
    .insert([{
      date: april10Briefing.date,
      day_of_week: april10Briefing.dayOfWeek
    }])
    .select()
    .single();

  if (briefingError) {
    console.error("Error creating briefing:", briefingError);
    return;
  }

  console.log("Created Briefing:", briefingResult.date, "with ID:", briefingResult.id);

  // 2. Prepare all the items
  const itemsToInsert = april10Briefing.items.map(item => ({
    briefing_id: briefingResult.id,
    category: item.category,
    title: item.title,
    year: item.year || null,
    short_explanation: item.shortExplanation,
    why_it_matters: item.whyItMatters,
    metadata_spotify_track_id: item.metadata?.spotifyTrackId || null
  }));

  // 3. Insert items
  const { error: itemsError } = await supabase
    .from("briefing_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("Error creating briefing items:", itemsError);
    return;
  }

  console.log("Successfully seeded", itemsToInsert.length, "items into the database!");
}

seed();
