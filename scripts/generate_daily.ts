import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials system variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── EDITORIAL CATEGORIZATION ───

function categorizeWikipediaArticle(pageText: string): "history" | "science" | "culture" | "warfare" | "space" | "sports" | "people" {
  const t = pageText.toLowerCase();
  if (t.includes("war ") || t.includes("battle") || t.includes("military") || t.includes("army")) return "warfare";
  if (t.includes("nasa") || t.includes("orbit") || t.includes("spacecraft") || t.includes("planet")) return "space";
  if (t.includes("discovery") || t.includes("scientist") || t.includes("physics") || t.includes("quantum")) return "science";
  if (t.includes("championship") || t.includes("olympic") || t.includes("tournament")) return "sports";
  if (t.includes("novel") || t.includes("film") || t.includes("artist") || t.includes("album")) return "culture";
  if (t.includes("born") || t.includes("death")) return "people";
  return "history";
}

// ─── VIRAL CATEGORIZATION ───
// Smart keyword matching to assign Wikipedia events to fun viral categories

function categorizeAsViral(text: string, extract: string): string | null {
  const combined = (text + " " + extract).toLowerCase();

  // Music: charts, #1, hit song, Grammy, album, singer, band
  if (combined.includes("number one") || combined.includes("billboard") || combined.includes("chart") ||
      combined.includes("#1") || combined.includes("grammy") || combined.includes("hit single") ||
      combined.includes("platinum") || combined.includes("album") || combined.includes("singer") ||
      combined.includes("band") || combined.includes("concert") || combined.includes("song")) {
    return "viral_music";
  }

  // Scandal: arrest, scandal, controversy, trial, impeach, resign, affair
  if (combined.includes("scandal") || combined.includes("arrest") || combined.includes("controversy") ||
      combined.includes("impeach") || combined.includes("resign") || combined.includes("affair") ||
      combined.includes("fraud") || combined.includes("trial") || combined.includes("convicted") ||
      combined.includes("fired") || combined.includes("banned")) {
    return "viral_scandal";
  }

  // Movies: premiere, film, box office, Oscar, director, movie, cinema
  if (combined.includes("premiere") || combined.includes("box office") || combined.includes("oscar") ||
      combined.includes("film") || combined.includes("movie") || combined.includes("cinema") ||
      combined.includes("directed") || combined.includes("academy award") || combined.includes("starring")) {
    return "viral_movie";
  }

  // Records: record, first, fastest, longest, guinness, broke, youngest, oldest
  if (combined.includes("record") || combined.includes("first person") || combined.includes("first woman") ||
      combined.includes("first man") || combined.includes("fastest") || combined.includes("longest") ||
      combined.includes("guinness") || combined.includes("youngest") || combined.includes("oldest") ||
      combined.includes("broke the record") || combined.includes("world record")) {
    return "viral_record";
  }

  // Viral moments: television, broadcast, live, viral, internet, social media, tweet
  if (combined.includes("television") || combined.includes("broadcast") || combined.includes("live") ||
      combined.includes("viral") || combined.includes("internet") || combined.includes("social media") ||
      combined.includes("meme") || combined.includes("trending")) {
    return "viral_moment";
  }

  return null;
}

// ─── IMAGE HANDLING ───

function isValidImageFormat(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp');
}

function getReliableImageUrl(page: any): string | null {
  // Prefer thumbnail (800px) — served from upload.wikimedia.org/thumb/, almost never blocked
  if (page.thumbnail?.source) {
    const biggerThumb = page.thumbnail.source.replace(/\/\d+px-/, '/800px-');
    if (isValidImageFormat(biggerThumb)) return biggerThumb;
    if (isValidImageFormat(page.thumbnail.source)) return page.thumbnail.source;
  }
  if (page.originalimage?.source && isValidImageFormat(page.originalimage.source)) {
    return page.originalimage.source;
  }
  return null;
}

async function isImageReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'HoxeDailyBriefing/1.0' }
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/');
  } catch {
    return false;
  }
}

// ─── MAIN GENERATION ───

async function generateLanguageDataset(targetDateObj: Date, languageCode: 'en' | 'es') {
  const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDateObj.getDate()).padStart(2, '0');
  const locales: Record<string, string> = { 'en': 'en-US', 'es': 'es-ES' };

  const dateString = targetDateObj.toLocaleDateString(locales[languageCode], { month: "long", day: "numeric" });
  const dayOfWeek = targetDateObj.toLocaleDateString(locales[languageCode], { weekday: "long" });

  // Idempotency
  const { data: existing } = await supabase
    .from("daily_briefings")
    .select("id")
    .eq("date", dateString)
    .eq("language", languageCode)
    .limit(1)
    .single();

  if (existing) {
    console.log(`[SKIP] ${dateString} (${languageCode}) already exists.`);
    return;
  }

  console.log(`\n[GENERATE] ${dateString} [${languageCode.toUpperCase()}]`);

  try {
    // Fetch both events AND deaths for richer content
    const [eventsRes, deathsRes] = await Promise.all([
      fetch(`https://${languageCode}.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`),
      fetch(`https://${languageCode}.wikipedia.org/api/rest_v1/feed/onthisday/deaths/${mm}/${dd}`)
    ]);

    const eventsData = await eventsRes.json();
    const deathsData = await deathsRes.json();

    // Create root briefing
    const { data: rootNode, error: rootError } = await supabase
      .from("daily_briefings")
      .insert([{ date: dateString, day_of_week: dayOfWeek, language: languageCode }])
      .select()
      .single();

    if (rootError) throw rootError;

    const allItems: any[] = [];

    // ── A) EDITORIAL items (regular categories) ──
    let editorialCandidates = (eventsData.events || [])
      .filter((e: any) => e.pages?.length > 0 && e.pages[0].extract)
      .sort(() => 0.5 - Math.random());

    for (const event of editorialCandidates) {
      if (allItems.filter(i => !i.category.startsWith('viral_')).length >= 6) break;

      const page = event.pages[0];
      const viralCat = categorizeAsViral(event.text || '', page.extract || '');
      if (viralCat) continue; // Skip — this will go in the viral section

      const candidateUrl = getReliableImageUrl(page);
      let finalUrl: string | null = null;
      if (candidateUrl) {
        const reachable = await isImageReachable(candidateUrl);
        finalUrl = reachable ? candidateUrl : null;
      }

      allItems.push({
        briefing_id: rootNode.id,
        category: categorizeWikipediaArticle(page.extract || ''),
        title: page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled',
        year: event.year ? String(event.year) : "Unknown",
        short_explanation: event.text,
        why_it_matters: page.extract,
        image_url: finalUrl,
        image_source: finalUrl ? "Wikimedia Commons" : null,
        metadata_spotify_track_id: null
      });
    }

    // ── B) VIRAL items (fun categories) ──
    const viralCategoriesUsed = new Set<string>();

    // Scan events for viral content
    for (const event of editorialCandidates) {
      if (viralCategoriesUsed.size >= 5) break;

      const page = event.pages[0];
      if (!page?.extract) continue;

      const viralCat = categorizeAsViral(event.text || '', page.extract || '');
      if (!viralCat || viralCategoriesUsed.has(viralCat)) continue;

      const candidateUrl = getReliableImageUrl(page);
      let finalUrl: string | null = null;
      if (candidateUrl) {
        const reachable = await isImageReachable(candidateUrl);
        finalUrl = reachable ? candidateUrl : null;
      }

      allItems.push({
        briefing_id: rootNode.id,
        category: viralCat,
        title: page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled',
        year: event.year ? String(event.year) : "Unknown",
        short_explanation: event.text,
        why_it_matters: page.extract,
        image_url: finalUrl,
        image_source: finalUrl ? "Wikimedia Commons" : null,
        metadata_spotify_track_id: null
      });

      viralCategoriesUsed.add(viralCat);
      console.log(`  🔥 Viral [${viralCat}]: ${(page.normalizedtitle || page.title || '').substring(0, 50)}`);
    }

    // ── C) FAMOUS DEATHS → viral_quote ──
    if (!viralCategoriesUsed.has("viral_quote") && deathsData.deaths?.length > 0) {
      const notableDeaths = deathsData.deaths
        .filter((d: any) => d.pages?.length > 0 && d.pages[0].extract)
        .sort(() => 0.5 - Math.random());

      for (const death of notableDeaths) {
        const page = death.pages[0];
        const candidateUrl = getReliableImageUrl(page);
        let finalUrl: string | null = null;
        if (candidateUrl) {
          const reachable = await isImageReachable(candidateUrl);
          finalUrl = reachable ? candidateUrl : null;
        }

        allItems.push({
          briefing_id: rootNode.id,
          category: "viral_quote",
          title: page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled',
          year: death.year ? String(death.year) : "Unknown",
          short_explanation: death.text || `Died on this day`,
          why_it_matters: page.extract,
          image_url: finalUrl,
          image_source: finalUrl ? "Wikimedia Commons" : null,
          metadata_spotify_track_id: null
        });

        viralCategoriesUsed.add("viral_quote");
        console.log(`  💀 Quote [death]: ${(page.normalizedtitle || page.title || '').substring(0, 50)}`);
        break;
      }
    }

    // Insert all items
    if (allItems.length > 0) {
      const { error: itemsError } = await supabase.from("briefing_items").insert(allItems);
      if (itemsError) throw itemsError;

      const editorial = allItems.filter(i => !i.category.startsWith('viral_')).length;
      const viral = allItems.filter(i => i.category.startsWith('viral_')).length;
      const withImg = allItems.filter(i => i.image_url).length;
      console.log(`✓ ${dateString} [${languageCode}]: ${editorial} editorial + ${viral} viral items (${withImg} with verified images)`);
    }

  } catch (err) {
    console.error(`✗ Failed ${dateString} [${languageCode}]:`, err);
  }
}

async function runAutomation() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  HOXE v5 — Multilingual Editorial + Viral Pipeline");
  console.log("  Strategy: Thumbnail-first, server-side HEAD validation");
  console.log("═══════════════════════════════════════════════════════\n");

  for (let offset = 0; offset < 5; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    await generateLanguageDataset(d, 'en');
    await generateLanguageDataset(d, 'es');
  }

  console.log("\n✓ Pipeline complete.");
}

runAutomation();
