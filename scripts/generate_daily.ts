import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════
//  CATEGORIZATION ENGINE (SCORING SYSTEM)
// ═══════════════════════════════════════════════

type EditorialCategory = "history" | "science" | "culture" | "warfare" | "space" | "sports" | "people" | "music";
type ViralCategory = "viral_music" | "viral_scandal" | "viral_movie" | "viral_moment" | "viral_record";

const EDITORIAL_SCORING: Record<EditorialCategory, Record<string, number>> = {
  warfare:  { "war ": 3, "battle": 3, "military": 2, "army": 2, "invasion": 4, "siege": 3, "troops": 2, "combat": 2, "bombing": 4, "naval": 2, "attack": 2, "revolt": 3, "revolution": 3, "coup": 4, "treaty": 2 },
  space:    { "nasa": 5, "orbit": 3, "spacecraft": 4, "planet": 3, "astronaut": 5, "rocket": 3, "satellite": 3, "lunar": 4, "mars": 4, "space ": 2, "cosmonaut": 5, "apollo": 4, "shuttle": 3, "galaxy": 3, "telescope": 3 },
  science:  { "discovery": 2, "scientist": 3, "physics": 3, "quantum": 4, "chemistry": 3, "biology": 3, "molecule": 3, "experiment": 2, "theory": 2, "research": 1, "vaccine": 4, "dna": 4, "earthquake": 3, "eruption": 3, "volcano": 3, "patent": 2, "invented": 3 },
  sports:   { "championship": 3, "olympic": 4, "tournament": 2, "world cup": 4, "medal": 2, "athlete": 3, "football": 2, "baseball": 2, "soccer": 2, "tennis": 2, "boxing": 2, "racing": 2, "marathon": 3, "grand prix": 3 },
  culture:  { "novel": 2, "film": 2, "artist": 2, "album": 2, "painting": 3, "museum": 2, "literature": 3, "theater": 2, "poetry": 3, "dance": 2, "exhibition": 2, "gallery": 2, "playwright": 3, "director": 2, "actor": 2, "actress": 2 },
  people:   { "born": 1, "death": 1, "president": 2, "king": 2, "queen": 2, "emperor": 2, "pope": 2, "prime minister": 2, "leader": 1, "assassinated": 3, "elected": 1, "inaugurated": 2, "crowned": 3 },
  music:    { "beatles": 5, "mccartney": 4, "lennon": 4, "singer": 3, "songwriter": 3, "musician": 4, "guitarist": 4, "drummer": 4, "bass": 2, "rock band": 4, "punk": 3, "jazz": 4, "blues": 3, "opera": 4, "symphony": 4, "orchestra": 4, "composer": 4, "debut album": 5, "concert": 3, "oratorio": 4, "concerto": 4, "premiere": 2, "pianist": 4, "violinist": 4, "hip hop": 4, "rapper": 4, "band": 2, "choir": 3, "reggae": 4, "soul": 3, "funk": 3, "disco": 4, "pop star": 4, "number one": 2, "billboard": 3 },
  history:  {} // Default fallback
};

const VIRAL_KEYWORDS: Record<ViralCategory, string[]> = {
  viral_music:   ["number one hit", "billboard hot", "chart-topping", "#1 single", "grammy", "hit single", "platinum album", "gold record", "top of the charts", "number-one", "best-selling", "debut album", "sold-out", "music video", "mtv"],
  viral_scandal: ["scandal", "impeach", "resign in disgrace", "corruption", "watergate", "cover-up", "whistleblow", "leaked", "exposed", "arrested", "assassination", "murder", "trial", "convicted", "notorious", "infamous", "outrage"],
  viral_movie:   ["box office", "oscar", "academy award", "best picture", "blockbuster", "highest-grossing", "film festival", "cannes", "golden globe", "motion picture", "premiere", "debut", "starring", "directed by"],
  viral_record:  ["world record", "guinness", "broke the record", "new record", "fastest", "longest", "largest", "tallest", "first person to", "first woman to", "first man to", "unprecedented", "record-breaking", "milestone"],
  viral_moment:  ["broadcast live", "viral video", "watched by millions", "trending", "social media sensation", "broke the internet", "live television", "historic moment", "shocked the world", "sensation", "celebrated", "viral"]
};

const EDITORIAL_QUOTAS: Record<EditorialCategory, [number, number]> = {
  history:  [3, 5],
  science:  [2, 4],
  warfare:  [1, 3],
  culture:  [1, 3],
  people:   [1, 3],
  space:    [1, 3],
  sports:   [1, 2],
  music:    [1, 2],
};

function categorizeScoring(text: string): EditorialCategory {
  const scores: Record<EditorialCategory, number> = {
    history: 0, science: 0, culture: 0, warfare: 0, space: 0, sports: 0, people: 0, music: 0
  };

  const lowerText = text.toLowerCase();
  
  for (const [cat, wordScores] of Object.entries(EDITORIAL_SCORING) as [EditorialCategory, Record<string, number>][]) {
    for (const [word, points] of Object.entries(wordScores)) {
      if (new RegExp(`\\b${word.replace(/[#-.]/g, '\\$&')}\\b`, 'i').test(lowerText)) {
        scores[cat] += points;
      }
    }
  }

  // Find max score
  let maxScore = 0;
  let winner: EditorialCategory = "history";
  
  for (const [cat, score] of Object.entries(scores) as [EditorialCategory, number][]) {
    if (score > maxScore) {
      maxScore = score;
      winner = cat;
    }
  }

  return winner;
}

function categorizeViral(text: string): ViralCategory | null {
  for (const [cat, keywords] of Object.entries(VIRAL_KEYWORDS)) {
    if (keywords.length === 0) continue;
    if (keywords.some(kw => new RegExp(`\\b${kw.replace(/[#-.]/g, '\\$&')}\\b`, 'i').test(text))) return cat as ViralCategory;
  }
  return null;
}

// ═══════════════════════════════════════════════
//  IMAGE ENGINE
// ═══════════════════════════════════════════════

function isValidImageFormat(url: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp');
}

function getReliableImageUrl(page: any): string | null {
  if (page.thumbnail?.source) {
    const big = page.thumbnail.source.replace(/\/\d+px-/, '/800px-');
    if (isValidImageFormat(big)) return big;
    if (isValidImageFormat(page.thumbnail.source)) return page.thumbnail.source;
  }
  if (page.originalimage?.source && isValidImageFormat(page.originalimage.source)) {
    return page.originalimage.source;
  }
  return null;
}

async function validateImage(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': 'HoxeBot/2.0' } });
    clearTimeout(t);
    if (!res.ok) return false;
    return (res.headers.get('content-type') || '').startsWith('image/');
  } catch { return false; }
}

async function resolveImage(page: any): Promise<string | null> {
  const directUrl = getReliableImageUrl(page);
  if (directUrl) {
    const ok = await validateImage(directUrl);
    if (ok) return directUrl;
  }

  const title = page.title || page.normalizedtitle;
  if (!title) return null;

  try {
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': 'HoxeBot/2.0' }
    });
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      if (summary.thumbnail?.source) {
        const thumbUrl = summary.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        if (isValidImageFormat(thumbUrl)) {
          const ok = await validateImage(thumbUrl);
          if (ok) return thumbUrl;
        }
        if (isValidImageFormat(summary.thumbnail.source)) {
          const ok = await validateImage(summary.thumbnail.source);
          if (ok) return summary.thumbnail.source;
        }
      }
      if (summary.originalimage?.source && isValidImageFormat(summary.originalimage.source)) {
        const ok = await validateImage(summary.originalimage.source);
        if (ok) return summary.originalimage.source;
      }
    }
  } catch { /* ignore fetch errors */ }

  return null;
}

// ═══════════════════════════════════════════════
//  YOUTUBE ENGINE (Replacing Spotify)
// ═══════════════════════════════════════════════

async function resolveYoutubeId(title: string): Promise<string | null> {
  try {
    const q = `site:youtube.com/watch "${title}"`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": "HoxeBot/2.0" } });
    const html = await res.text();
    // Match youtube.com/watch?v=VIDEO_ID
    const match = html.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}

const YOUTUBE_FALLBACK_TRACKS = [
  "fJ9rUzIMcZQ", // Bohemian Rhapsody - Queen
  "YkgkThdzX-8", // Imagine - John Lennon
  "gGdGFtwCNBE", // Mr. Brightside - The Killers
  "dQw4w9WgXcQ", // Never Gonna Give You Up - Rick Astley
  "8UVNT4wvIGY", // Somebody That I Used to Know - Gotye
  "kJQP7kiw5Fk", // Despacito - Luis Fonsi
];

let fallbackIndex = 0;
function getNextFallbackYoutube(): string {
  const track = YOUTUBE_FALLBACK_TRACKS[fallbackIndex % YOUTUBE_FALLBACK_TRACKS.length];
  fallbackIndex++;
  return track;
}

// ═══════════════════════════════════════════════
//  PIPELINE
// ═══════════════════════════════════════════════

export async function generateForDate(targetDateObj: Date, force: boolean = false) {
  const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDateObj.getDate()).padStart(2, '0');

  const dateString = targetDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const dayOfWeek = targetDateObj.toLocaleDateString("en-US", { weekday: "long" });

  const { data: existing } = await supabase
    .from("daily_briefings")
    .select("id")
    .eq("date", dateString)
    .limit(1)
    .single();

  if (existing && !force) {
    console.log(`[SKIP] ${dateString} already exists. Use --force to regenerate.`);
    return;
  }

  if (existing && force) {
    console.log(`[FORCE] Deleting existing ${dateString}...`);
    await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
    await supabase.from("daily_briefings").delete().eq("id", existing.id);
  }

  console.log(`\n══ GENERATING: ${dateString} (${dayOfWeek}) ══`);

  try {
    const [eventsRes, deathsRes, birthsRes] = await Promise.all([
      fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`),
      fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/deaths/${mm}/${dd}`),
      fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`)
    ]);

    const eventsData = await eventsRes.json();
    const deathsData = await deathsRes.json();
    const birthsData = await birthsRes.json();

    const { data: root, error: rootErr } = await supabase
      .from("daily_briefings")
      .insert([{ date: dateString, day_of_week: dayOfWeek }])
      .select().single();

    if (rootErr) throw rootErr;

    const allItems: any[] = [];

    const allEvents = (eventsData.events || [])
      .filter((e: any) => e.pages?.length > 0 && e.pages[0].extract)
      .sort(() => 0.5 - Math.random());

    const pools: Record<string, any[]> = {
      history: [], science: [], culture: [], warfare: [], space: [], sports: [], people: [], music: [],
      viral_music: [], viral_scandal: [], viral_movie: [], viral_record: [], viral_moment: []
    };

    for (const event of allEvents) {
      const page = event.pages[0];
      const combined = (event.text || '') + ' ' + (page.extract || '');
      
      const viralCat = categorizeViral(combined);
      if (viralCat) {
        pools[viralCat].push({ event, page, year: event.year });
        // ALSO add to editorial using scoring
        pools[categorizeScoring(combined)].push({ event, page, year: event.year });
        continue;
      }
      pools[categorizeScoring(combined)].push({ event, page, year: event.year });
    }

    // ── Process Editorial items ──
    for (const [cat, limits] of Object.entries(EDITORIAL_QUOTAS) as [EditorialCategory, [number, number]][]) {
      let count = 0;
      for (const { event, page, year } of pools[cat]) {
        if (count >= limits[1]) break;
        
        const imgUrl = await resolveImage(page);
        if (!imgUrl) continue;
        
        const title = page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled';
        let ytId: string | null = null;
        if (cat === "music") {
          ytId = await resolveYoutubeId(title + " official audio");
          if (!ytId) ytId = getNextFallbackYoutube();
        }

        allItems.push({
          briefing_id: root.id, category: cat, title, year: year ? String(year) : "Unknown",
          short_explanation: event.text, why_it_matters: page.extract, image_url: imgUrl,
          image_source: "Wikimedia Commons", metadata_spotify_track_id: ytId // Reusing column for YT ID
        });
        count++;
      }
    }

    // ── Music fallback via births ──
    const musicCount = allItems.filter(i => i.category === 'music').length;
    if (musicCount < 1) {
      console.log("  ℹ No music from events, searching births for musicians...");
      const births = (birthsData.births || [])
        .filter((b: any) => b.pages?.length > 0 && b.pages[0].extract)
        .sort(() => 0.5 - Math.random());
      
      for (const birth of births) {
        if (allItems.filter(i => i.category === 'music').length >= 1) break;
        const page = birth.pages[0];
        const combined = (birth.text || '') + ' ' + (page.extract || '');
        if (!categorizeScoring(combined).match(/music|culture/)) continue;
        
        const imgUrl = await resolveImage(page);
        if (!imgUrl) continue;
        
        const title = page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled';
        let ytId = await resolveYoutubeId(title + " official music video");
        if (!ytId) ytId = getNextFallbackYoutube();
        
        allItems.push({
          briefing_id: root.id, category: "music", title,
          year: birth.year ? String(birth.year) : "Unknown",
          short_explanation: birth.text || `Born on this day`,
          why_it_matters: page.extract, image_url: imgUrl,
          image_source: "Wikimedia Commons", metadata_spotify_track_id: ytId
        });
      }
    }

    // ── Process Viral items ──
    let viralFound = 0;
    const saveViral = async (cat: string, candidate: any, requireImage: boolean = false) => {
        const imgUrl = await resolveImage(candidate.page);
        if (requireImage && !imgUrl) return false;
        
        const title = candidate.page.normalizedtitle || candidate.page.title?.replace(/_/g, ' ') || 'Untitled';
        let ytId: string | null = null;
        if (cat === "viral_music" || cat === "music") {
          ytId = await resolveYoutubeId(title + " official");
          if (!ytId) ytId = getNextFallbackYoutube();
        }
        
        allItems.push({
          briefing_id: root.id, category: cat, title, year: candidate.year ? String(candidate.year) : "Unknown",
          short_explanation: candidate.event.text, why_it_matters: candidate.page.extract, 
          image_url: imgUrl,
          image_source: imgUrl ? "Wikimedia Commons" : null, metadata_spotify_track_id: ytId
        });
        viralFound++;
        return true;
    };

    if (pools.viral_music.length > 0) {
      for (const cand of pools.viral_music) {
        if (await saveViral("viral_music", cand)) break;
      }
    }

    const viralKeys = ["viral_scandal", "viral_movie", "viral_record", "viral_moment", "viral_music"];
    let keepLooking = true;
    while(keepLooking && viralFound < 5) {
      let foundInRound = false;
      for (const k of viralKeys) {
        if (viralFound >= 5) break;
        if (pools[k].length > 0) {
          const cand = pools[k].shift();
          const success = await saveViral(k, cand);
          if (success) foundInRound = true;
        }
      }
      if (!foundInRound) keepLooking = false;
    }

    if (viralFound < 5) {
      console.log(`  ℹ Only ${viralFound} viral from keywords, backfilling from recent history...`);
      const allUnusedEvents = [...pools.history, ...pools.science, ...pools.culture, ...pools.sports]
        .filter(c => c.year && parseInt(c.year) > 1900)
        .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
      
      for (const candidate of allUnusedEvents) {
        if (viralFound >= 5) break;
        const title = candidate.page.normalizedtitle || candidate.page.title?.replace(/_/g, ' ') || 'Untitled';
        if (allItems.some(i => i.title === title)) continue;
        await saveViral("viral_moment", candidate);
      }
    }

    if (viralFound < 5) {
      console.log(`  ℹ Still only ${viralFound} viral, using any remaining events...`);
      for (const candidate of pools.history) {
        if (viralFound >= 5) break;
        const title = candidate.page.normalizedtitle || candidate.page.title?.replace(/_/g, ' ') || 'Untitled';
        if (allItems.some(i => i.title === title)) continue;
        await saveViral("viral_moment", candidate);
      }
    }

    const peopleCount = allItems.filter(i => i.category === 'people').length;
    if (peopleCount < 3) {
      const deaths = (deathsData.deaths || []).filter((d: any) => d.pages?.length > 0 && d.pages[0].extract).sort(() => 0.5 - Math.random());
      for (const death of deaths) {
        if (allItems.filter(i => i.category === 'people').length >= 3) break;
        const page = death.pages[0];
        const imgUrl = await resolveImage(page);
        if (!imgUrl) continue;
        allItems.push({
          briefing_id: root.id, category: "people", title: page.normalizedtitle || page.title?.replace(/_/g, ' '),
          year: death.year ? String(death.year) : "Unknown", short_explanation: death.text || `Died on this day`,
          why_it_matters: page.extract, image_url: imgUrl, image_source: "Wikimedia Commons", metadata_spotify_track_id: null
        });
      }
    }

    if (allItems.length > 0) {
      // ── Translate with Azure before insert ──
      console.log(`  ⏳ Translating ${allItems.length} items to ES + GL via Azure...`);
      const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
      const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || "global";
      if (!AZURE_KEY) {
        console.warn("  ⚠ Missing AZURE_TRANSLATOR_KEY. Skipping translation for new items.");
      } else {
        const batchTranslate = async (texts: string[]) => {
          const body = texts.map(t => ({ Text: (t || "").substring(0, 10000) }));
          const res = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es&to=gl`, {
            method: "POST",
            headers: {
              "Ocp-Apim-Subscription-Key": AZURE_KEY,
              "Ocp-Apim-Subscription-Region": AZURE_REGION,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          return data.map((item: any) => ({
            es: item.translations?.find((t: any) => t.to === "es")?.text || "",
            gl: item.translations?.find((t: any) => t.to === "gl")?.text || "",
          }));
        };

        const BATCH_SIZE = 4;
        let done = 0;
        let failed = 0;
        for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
          const batch = allItems.slice(i, i + BATCH_SIZE);
          try {
            const texts = batch.flatMap(item => [item.title || "", item.short_explanation || "", item.why_it_matters || ""]);
            const results = await batchTranslate(texts);
            
            for (let j = 0; j < batch.length; j++) {
              const titleIdx = j * 3;
              const shortIdx = j * 3 + 1;
              const whyIdx = j * 3 + 2;
              batch[j].title_es = results[titleIdx].es;
              batch[j].title_gl = results[titleIdx].gl;
              batch[j].short_explanation_es = results[shortIdx].es;
              batch[j].short_explanation_gl = results[shortIdx].gl;
              batch[j].why_it_matters_es = results[whyIdx].es;
              batch[j].why_it_matters_gl = results[whyIdx].gl;
            }
            await new Promise(r => setTimeout(r, 4500)); // Respect Azure rate limit
          } catch (err: any) {
            console.error(`  ✗ Translation batch failed: ${err.message.substring(0, 100)}`);
            failed += batch.length;
          }
          done += batch.length;
        }
        console.log(`  ✓ Translation complete. Success: ${done - failed}, Failed: ${failed}`);
      }

      const { error } = await supabase.from("briefing_items").insert(allItems);
      if (error) throw error;

      const editorial = allItems.filter(i => !i.category.startsWith('viral_')).length;
      const viral = allItems.filter(i => i.category.startsWith('viral_')).length;
      const withImg = allItems.filter(i => i.image_url).length;
      const musicItems = allItems.filter(i => i.category === 'music').length;
      console.log(`  ✓ COMMITTED: ${editorial} editorial + ${viral} viral (${withImg} with images, ${musicItems} music)\n`);
    }

  } catch (err) {
    console.error(`  ✗ FAILED: ${dateString}`, err);
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  HOXE v7 — YouTube Engine & Scoring Categorizer ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const forceFlag = process.argv.includes('--force');
  if (forceFlag) console.log("⚡ FORCE MODE: Will regenerate existing dates.\n");

  for (let offset = 0; offset < 5; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    await generateForDate(d, forceFlag);
  }

  console.log("✓ Pipeline complete.");
}

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('generate_daily')) {
  main();
}
