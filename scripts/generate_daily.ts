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
//  CATEGORIZATION ENGINE
// ═══════════════════════════════════════════════

type EditorialCategory = "history" | "science" | "culture" | "warfare" | "space" | "sports" | "people" | "music";
type ViralCategory = "viral_music" | "viral_scandal" | "viral_movie" | "viral_quote" | "viral_moment" | "viral_record";

const EDITORIAL_KEYWORDS: Record<EditorialCategory, string[]> = {
  warfare:  ["war ", "battle", "military", "army", "invasion", "siege", "troops", "combat", "bombing", "naval"],
  space:    ["nasa", "orbit", "spacecraft", "planet", "astronaut", "rocket", "satellite", "lunar", "mars", "space"],
  science:  ["discovery", "scientist", "physics", "quantum", "chemistry", "biology", "molecule", "experiment", "theory", "research"],
  sports:   ["championship", "olympic", "tournament", "world cup", "medal", "athlete", "football", "baseball", "soccer", "tennis"],
  culture:  ["novel", "film", "artist", "album", "painting", "museum", "literature", "theater", "poetry", "dance"],
  people:   ["born", "death", "president", "king", "queen", "emperor", "pope", "prime minister", "leader"],
  music:    ["beatles", "mccartney", "lennon", "singer", "songwriter", "musician", "guitarist", "drummer", "bass", "rock band", "punk", "jazz", "blues", "opera", "symphony", "orchestra", "composer", "debut album"],
  history:  [] // Default fallback
};

const VIRAL_KEYWORDS: Record<ViralCategory, string[]> = {
  viral_music:   ["number one", "billboard", "chart", "#1", "grammy", "hit single", "platinum", "album release", "gold record", "top of the charts"],
  viral_scandal: ["scandal", "arrest", "controversy", "impeach", "resign", "affair", "fraud", "trial", "convicted", "fired", "banned", "accused"],
  viral_movie:   ["premiere", "box office", "oscar", "film release", "movie", "cinema", "academy award", "starring", "directed by"],
  viral_record:  ["world record", "first person", "first woman", "first man", "fastest", "longest", "guinness", "youngest", "oldest", "broke the record"],
  viral_moment:  ["television", "broadcast live", "viral", "internet", "social media", "meme", "trending", "sensation"],
  viral_quote:   [] // Filled from deaths endpoint
};

// Category quotas: [min, max]
const EDITORIAL_QUOTAS: Record<EditorialCategory, [number, number]> = {
  history:  [3, 5],
  science:  [2, 4],
  warfare:  [1, 3],
  culture:  [1, 3],
  people:   [1, 3],
  space:    [1, 2],
  sports:   [1, 2],
  music:    [0, 2],
};

function categorize(text: string): EditorialCategory {
  const t = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(EDITORIAL_KEYWORDS)) {
    if (cat === "history") continue; // Default
    if (keywords.some(kw => t.includes(kw))) return cat as EditorialCategory;
  }
  return "history";
}

function categorizeViral(text: string): ViralCategory | null {
  const t = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(VIRAL_KEYWORDS)) {
    if (keywords.length === 0) continue;
    if (keywords.some(kw => t.includes(kw))) return cat as ViralCategory;
  }
  return null;
}

// ═══════════════════════════════════════════════
//  IMAGE ENGINE — Bulletproof
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
  // Strategy 1: Use thumbnail already in the On This Day response
  const directUrl = getReliableImageUrl(page);
  if (directUrl) {
    const ok = await validateImage(directUrl);
    if (ok) return directUrl;
  }

  // Strategy 2: Fetch the Wikipedia page summary — this almost always has a thumbnail
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
        // Try original size from thumbnail
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
//  PIPELINE
// ═══════════════════════════════════════════════

async function generateForDate(targetDateObj: Date) {
  const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDateObj.getDate()).padStart(2, '0');

  // CANONICAL: Always use en-US for the database key
  const dateString = targetDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const dayOfWeek = targetDateObj.toLocaleDateString("en-US", { weekday: "long" });

  // Idempotency
  const { data: existing } = await supabase
    .from("daily_briefings")
    .select("id")
    .eq("date", dateString)
    .limit(1)
    .single();

  if (existing) {
    console.log(`[SKIP] ${dateString} already exists.`);
    return;
  }

  console.log(`\n══ GENERATING: ${dateString} (${dayOfWeek}) ══`);

  try {
    // Fetch ALL Wikipedia sources in parallel
    const [eventsRes, deathsRes, birthsRes] = await Promise.all([
      fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`),
      fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/deaths/${mm}/${dd}`),
      fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`)
    ]);

    const eventsData = await eventsRes.json();
    const deathsData = await deathsRes.json();
    const birthsData = await birthsRes.json();

    // Create root briefing
    const { data: root, error: rootErr } = await supabase
      .from("daily_briefings")
      .insert([{ date: dateString, day_of_week: dayOfWeek }])
      .select().single();

    if (rootErr) throw rootErr;

    const allItems: any[] = [];

    // ── STEP 1: Categorize ALL events ──
    const allEvents = (eventsData.events || [])
      .filter((e: any) => e.pages?.length > 0 && e.pages[0].extract)
      .sort(() => 0.5 - Math.random());

    // Buckets for editorial categories
    const editorialBuckets: Record<EditorialCategory, any[]> = {
      history: [], science: [], culture: [], warfare: [], space: [], sports: [], people: [], music: []
    };

    // Buckets for viral categories
    const viralBuckets: Record<string, any[]> = {
      viral_music: [], viral_scandal: [], viral_movie: [], viral_record: [], viral_moment: []
    };

    for (const event of allEvents) {
      const page = event.pages[0];
      const combined = (event.text || '') + ' ' + (page.extract || '');

      // Try viral first (more specific)
      const viralCat = categorizeViral(combined);
      if (viralCat && viralBuckets[viralCat] !== undefined && viralBuckets[viralCat].length < 3) {
        viralBuckets[viralCat].push({ event, page, year: event.year });
        continue;
      }

      // Editorial category
      const editCat = categorize(combined);
      const [, max] = EDITORIAL_QUOTAS[editCat];
      if (editorialBuckets[editCat].length < max) {
        editorialBuckets[editCat].push({ event, page, year: event.year });
      }
    }

    // ── STEP 2: Fill under-served editorial categories from remaining events ──
    for (const event of allEvents) {
      const page = event.pages[0];
      const combined = (event.text || '') + ' ' + (page.extract || '');
      const editCat = categorize(combined);
      const [min] = EDITORIAL_QUOTAS[editCat];

      // Already assigned somewhere?
      const alreadyUsed = Object.values(editorialBuckets).flat().some(b => b.page.title === page.title) ||
                          Object.values(viralBuckets).flat().some(b => b.page.title === page.title);
      if (alreadyUsed) continue;

      if (editorialBuckets[editCat].length < min) {
        editorialBuckets[editCat].push({ event, page, year: event.year });
      }
    }

    // ── STEP 3: Process editorial items with image validation ──
    for (const [cat, bucket] of Object.entries(editorialBuckets)) {
      for (const { event, page, year } of bucket) {
        const imgUrl = await resolveImage(page);
        allItems.push({
          briefing_id: root.id,
          category: cat,
          title: page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled',
          year: year ? String(year) : "Unknown",
          short_explanation: event.text,
          why_it_matters: page.extract,
          image_url: imgUrl,
          image_source: imgUrl ? "Wikimedia Commons" : null,
          metadata_spotify_track_id: null
        });
      }
      if (bucket.length > 0) {
        console.log(`  📰 ${cat}: ${bucket.length} items`);
      }
    }

    // ── STEP 4: Process viral items ──
    for (const [cat, bucket] of Object.entries(viralBuckets)) {
      for (const { event, page, year } of bucket) {
        const imgUrl = await resolveImage(page);
        allItems.push({
          briefing_id: root.id,
          category: cat,
          title: page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled',
          year: year ? String(year) : "Unknown",
          short_explanation: event.text,
          why_it_matters: page.extract,
          image_url: imgUrl,
          image_source: imgUrl ? "Wikimedia Commons" : null,
          metadata_spotify_track_id: null
        });
      }
      if (bucket.length > 0) console.log(`  🔥 ${cat}: ${bucket.length}`);
    }

    // ── STEP 5: Deaths → viral_quote ──
    if (!viralBuckets["viral_quote"]) {
      const deaths = (deathsData.deaths || [])
        .filter((d: any) => d.pages?.length > 0 && d.pages[0].extract)
        .sort(() => 0.5 - Math.random());

      for (const death of deaths.slice(0, 3)) {
        const page = death.pages[0];
        const imgUrl = await resolveImage(page);
        allItems.push({
          briefing_id: root.id,
          category: "viral_quote",
          title: page.normalizedtitle || page.title?.replace(/_/g, ' '),
          year: death.year ? String(death.year) : "Unknown",
          short_explanation: death.text || `Died on this day`,
          why_it_matters: page.extract,
          image_url: imgUrl,
          image_source: imgUrl ? "Wikimedia Commons" : null,
          metadata_spotify_track_id: null
        });
        console.log(`  💀 viral_quote: 1`);
      }
    }

    // ── STEP 6: Births → people category boost ──
    if (editorialBuckets.people.length < 2) {
      const births = (birthsData.births || [])
        .filter((b: any) => b.pages?.length > 0 && b.pages[0].extract)
        .sort(() => 0.5 - Math.random());

      for (const birth of births.slice(0, 2)) {
        const page = birth.pages[0];
        const imgUrl = await resolveImage(page);
        allItems.push({
          briefing_id: root.id,
          category: "people",
          title: page.normalizedtitle || page.title?.replace(/_/g, ' '),
          year: birth.year ? String(birth.year) : "Unknown",
          short_explanation: birth.text || `Born on this day`,
          why_it_matters: page.extract,
          image_url: imgUrl,
          image_source: imgUrl ? "Wikimedia Commons" : null,
          metadata_spotify_track_id: null
        });
      }
      if (births.length > 0) console.log(`  👤 people (births): +${Math.min(2, births.length)}`);
    }

    // ── COMMIT ──
    if (allItems.length > 0) {
      const { error } = await supabase.from("briefing_items").insert(allItems);
      if (error) throw error;

      const editorial = allItems.filter(i => !i.category.startsWith('viral_')).length;
      const viral = allItems.filter(i => i.category.startsWith('viral_')).length;
      const withImg = allItems.filter(i => i.image_url).length;
      console.log(`  ✓ COMMITTED: ${editorial} editorial + ${viral} viral (${withImg} with verified images)\n`);
    }

  } catch (err) {
    console.error(`  ✗ FAILED: ${dateString}`, err);
  }
}

// ═══════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  HOXE v5 — Category Quota Pipeline              ║");
  console.log("║  Thumbnails + HEAD validation + Smart routing    ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  for (let offset = 0; offset < 5; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    await generateForDate(d);
  }

  console.log("✓ Pipeline complete.");
}

main();
