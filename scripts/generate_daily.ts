import { createClient } from "@supabase/supabase-js";

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

async function runAutomation() {
  console.log("Starting HOXE Free Automated Pipeline (Wikipedia OnThisDay API)...");
  
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const dateString = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

  try {
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`);
    const wikiData = await wikiRes.json();
    
    // Filter events that have high-res imagery available and a substantial article abstract
    let viableEvents = wikiData.events.filter((e: any) => 
      e.pages && e.pages.length > 0 && e.pages[0].originalimage && e.pages[0].extract
    );
    
    // Randomize slightly so if the script runs again it grabs different events from the same day
    viableEvents = viableEvents.sort(() => 0.5 - Math.random()).slice(0, 6);

    console.log(`Found ${viableEvents.length} viable historic events for today.`);

    console.log("Saving new daily briefing node...");
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

    console.log("Committing cards to database...");
    const { error: itemsError } = await supabase
      .from("briefing_items")
      .insert(preparedItems);

    if (itemsError) throw itemsError;

    console.log(`HOXE Generation Complete for ${dateString} using Wikipedia ZERO-COST pipeline.`);

  } catch (err) {
    console.error("Critical failure during Wikipedia Automation:", err);
    process.exit(1);
  }
}

runAutomation();
