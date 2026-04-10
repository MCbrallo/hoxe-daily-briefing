import { createClient } from "@supabase/supabase-js";

// Ensure environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// We use the Service Role Key here to bypass any potential RLS write blocks when automating
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials system variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FALLBACK_IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/e/e0/Clouds_over_the_Atlantic_Ocean.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/2/22/Earth_Western_Hemisphere.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/4/42/Samuel_Morse_1840.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/b/b3/BepiColombo_in_cruise_configuration_%28transparent%29.png"
];

async function fetchWikipediaImage(articleTitle: string) {
  try {
    const safeTitle = encodeURIComponent(articleTitle.replace(/ /g, '_'));
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${safeTitle}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.originalimage && data.originalimage.source) {
      return data.originalimage.source;
    }
    if (data.thumbnail && data.thumbnail.source) {
      return data.thumbnail.source.replace(/\/\d+px-/, '/1024px-'); // Attempt high-res upscaling
    }
  } catch (error) {
    console.error(`Wikipedia fetch failed for ${articleTitle}`);
  }
  return null;
}

async function runAutomation() {
  console.log("Starting HOXE Daily Automation Pipeline...");
  
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  
  if (!OPENAI_API_KEY) {
    console.warn("No OPENAI_API_KEY detected. Terminating early (Ensure GitHub Secrets are configured).");
    process.exit(0);
  }

  const prompt = `You are the lead editor for HOXE, an elite Swiss-design inspired historical briefing app.
Compile exactly 6 monumental historical, scientific, or cultural events that occurred EXACTLY on ${dateString} in history.
The events should span ancient history to modern day (e.g. 1 x History, 1 x Science, 1 x Culture, 1 x Space, etc.).

Return ONLY a perfectly formed JSON object matching this schema exactly without markdown formatting or surrounding text:
{
  "introAtmosphere": "A single, highly atmospheric and slightly poetic sentence summarizing the mood of today's historical legacy.",
  "items": [
    {
      "category": "history", // Must be one of: history, local, music, science, observance, people, curiosity, warfare, sports, space, culture
      "title": "Short punchy title of the event",
      "year": "1912",
      "shortExplanation": "A crisp, single sentence explaining what happened.",
      "whyItMatters": "A deeply analytical, 3-4 sentence paragraph exploring the lasting legacy, written in an elite journalistic tone.",
      "wikipediaArticleTitle": "RMS_Titanic" // The EXACT English Wikipedia article title to fetch the main photo from
    }
  ]
}`;

  console.log("Querying OpenAI for", dateString, "...");
  let editorialData;

  try {
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    
    const result = await aiResponse.json();
    const rawJson = result.choices[0].message.content.replace(/```json|```/g, '').trim();
    editorialData = JSON.parse(rawJson);
  } catch (error) {
    console.error("Critical failure querying LLM:", error);
    process.exit(1);
  }

  // 1. Establish the Daily Briefing Root
  console.log("Saving new daily briefing node...");
  const { data: rootNode, error: rootError } = await supabase
    .from("daily_briefings")
    .insert([{ date: dateString, day_of_week: dayOfWeek }])
    .select()
    .single();

  if (rootError) {
    console.error("Database Insert Error:", rootError);
    process.exit(1);
  }

  // 2. Process and Source Imagery for Items
  console.log("Sourcing historical imagery...");
  const preparedItems = [];
  
  for (let i = 0; i < editorialData.items.length; i++) {
    const item = editorialData.items[i];
    
    let imageUrl = await fetchWikipediaImage(item.wikipediaArticleTitle);
    let imageSource = `Wikipedia Commons`;
    
    if (!imageUrl) {
      imageUrl = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
      imageSource = "Archival via Wikimedia";
    }

    preparedItems.push({
      briefing_id: rootNode.id,
      category: item.category,
      title: item.title,
      year: item.year,
      short_explanation: item.shortExplanation,
      why_it_matters: item.whyItMatters,
      image_url: imageUrl,
      image_source: imageSource,
      metadata_spotify_track_id: null // Music track omitted from auto-gen for simplicity, AI could add it later
    });
  }

  // 3. Inject to Database
  console.log("Committing cards to database...");
  const { error: itemsError } = await supabase
    .from("briefing_items")
    .insert(preparedItems);

  if (itemsError) {
    console.error("Failed to commit items:", itemsError);
    process.exit(1);
  }

  console.log(`HOXE Generation Complete for ${dateString}.`);
}

runAutomation();
