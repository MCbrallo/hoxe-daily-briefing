import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Ensure environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// We use the Service Role Key here to bypass any potential RLS write blocks when automating
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials system variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function categorizeWikipediaArticle(pageText: string): "history" | "science" | "culture" | "warfare" | "space" | "sports" | "people" {
  const t = pageText.toLowerCase();
  // Semantic routing for UI colors/icons
  if (t.includes("war ") || t.includes("battle") || t.includes("military") || t.includes("army")) return "warfare";
  if (t.includes("nasa") || t.includes("orbit") || t.includes("spacecraft") || t.includes("planet")) return "space";
  if (t.includes("discovery") || t.includes("scientist") || t.includes("physics") || t.includes("quantum")) return "science";
  if (t.includes("championship") || t.includes("olympic") || t.includes("tournament")) return "sports";
  if (t.includes("novel") || t.includes("film") || t.includes("artist") || t.includes("album")) return "culture";
  if (t.includes("born") || t.includes("death")) return "people";
  return "history";
}

function isValidImageFormat(url: string) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.webp');
}

async function runAutomation() {
  console.log("Starting HOXE 5-Day Forward Predictive Automation Pipeline...");
  
  // We want to generate today and the next 4 days (5 total)
  for (let offset = 0; offset < 5; offset++) {
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + offset);
    
    const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDateObj.getDate()).padStart(2, '0');

    const dateString = targetDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const dayOfWeek = targetDateObj.toLocaleDateString("en-US", { weekday: "long" });

    // Idempotency Check: Don't overwrite if it already exists
    const { data: existingData } = await supabase
      .from("daily_briefings")
      .select("id")
      .eq("date", dateString)
      .limit(1)
      .single();

    if (existingData) {
      console.log(`[SKIP] Briefing for ${dateString} already exists.`);
      continue;
    }

    console.log(`\n[GENERATE] Building briefing for ${dateString}...`);

    try {
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`);
      const wikiData = await wikiRes.json();
      
      // Filter events that have HIGH-RES SAFE imagery available (NO SVGs or TIFs)
      let viableEvents = wikiData.events.filter((e: any) => 
        e.pages && 
        e.pages.length > 0 && 
        e.pages[0].originalimage && 
        e.pages[0].extract &&
        isValidImageFormat(e.pages[0].originalimage.source)
      );
      
      // Randomize slightly so if the script runs again it grabs different events from the same day
      viableEvents = viableEvents.sort(() => 0.5 - Math.random()).slice(0, 6);

      console.log(`Found ${viableEvents.length} viable historic events.`);

      const { data: rootNode, error: rootError } = await supabase
        .from("daily_briefings")
        .insert([{ date: dateString, day_of_week: dayOfWeek }])
        .select()
        .single();

      if (rootError) throw rootError;

      const preparedItems = viableEvents.map((event: any) => {
        const page = event.pages[0];
        const imageUrl = page.originalimage.source;
        const title = page.normalizedtitle || page.title.replace(/_/g, ' ');
        const shortExplanation = event.text; // The punchy one-liner of what happened
        const whyItMatters = page.extract; // The deep contextual article summary
        const category = categorizeWikipediaArticle(whyItMatters);
        const year = event.year ? String(event.year) : "Unknown";

        return {
          briefing_id: rootNode.id,
          category: category,
          title: title,
          year: year,
          short_explanation: shortExplanation,
          why_it_matters: whyItMatters,
          image_url: imageUrl,
          image_source: "Photo by Wikimedia Commons",
          metadata_spotify_track_id: null
        };
      });

      const { error: itemsError } = await supabase
        .from("briefing_items")
        .insert(preparedItems);

      if (itemsError) throw itemsError;

      console.log(`Successfully committed cards for ${dateString}.`);

    } catch (err) {
      console.error(`Failure processing Wikipedia Automation for ${dateString}:`, err);
      // We do not process.exit(1) here so that we can continue the loop for next days safely
    }
  }
  
  console.log("\nPipeline Execution Complete.");
}

runAutomation();
