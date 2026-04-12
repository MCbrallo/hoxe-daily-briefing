import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ExcelRow {
  app_date: string;
  event_date: string;
  year: number | string;
  category: string;
  subcategory?: string;
  headline: string;
  description: string;
  place?: string;
  people_involved?: string;
  significance_level?: string;
  source_1?: string;
  source_2?: string;
  verification_notes?: string;
  language?: string;
}

// ═══════════════════════════════════════════════
//  THE IMAGE HUNTER v3 — ABSOLUTE COVERAGE
// ═══════════════════════════════════════════════
// Strategy: Try EVERY possible search term until we find an image.
// Order: headline → simplified headline → people → place → subcategory → category

function isValidImageFormat(url: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp') || clean.endsWith('.svg');
}

async function validateImage(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': 'HoxeBot/3.0' } });
    clearTimeout(t);
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/');
  } catch { return false; }
}

async function fetchWikiImage(query: string): Promise<string | null> {
  try {
    // Step 1: Direct summary API
    const directRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'HoxeBot/3.0' }
    });
    
    if (directRes.ok) {
      const sum = await directRes.json();
      if (sum.thumbnail?.source) {
        const hiRes = sum.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        if (isValidImageFormat(hiRes) && await validateImage(hiRes)) return hiRes;
        if (isValidImageFormat(sum.thumbnail.source) && await validateImage(sum.thumbnail.source)) return sum.thumbnail.source;
      }
      if (sum.originalimage?.source && isValidImageFormat(sum.originalimage.source)) {
        if (await validateImage(sum.originalimage.source)) return sum.originalimage.source;
      }
    }
    
    // Step 2: Wikipedia Search API fallback
    const searchApi = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`);
    if (searchApi.ok) {
      const sr = await searchApi.json();
      if (sr.query?.search?.length > 0) {
        // Try first 3 search results
        for (let i = 0; i < Math.min(3, sr.query.search.length); i++) {
          const hitTitle = sr.query.search[i].title;
          const hitRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hitTitle)}`, {
            headers: { 'User-Agent': 'HoxeBot/3.0' }
          });
          if (hitRes.ok) {
            const hitSum = await hitRes.json();
            if (hitSum.thumbnail?.source) {
              const hitUrl = hitSum.thumbnail.source.replace(/\/\d+px-/, '/800px-');
              if (isValidImageFormat(hitUrl) && await validateImage(hitUrl)) return hitUrl;
            }
          }
        }
      }
    }
  } catch {}
  return null;
}

async function huntImage(card: ExcelRow): Promise<string | null> {
  // Attempt 1: Full headline
  let url = await fetchWikiImage(card.headline);
  if (url) return url;

  // Attempt 2: Simplified headline (before first comma or "and")
  const simplified = card.headline.split(/[,;:]/)[0].trim();
  if (simplified !== card.headline) {
    url = await fetchWikiImage(simplified);
    if (url) return url;
  }

  // Attempt 3: People involved
  if (card.people_involved && String(card.people_involved).trim()) {
    const people = String(card.people_involved).split(/[,;]/);
    for (const person of people.slice(0, 2)) {
      const p = person.trim();
      if (p.length > 2) {
        url = await fetchWikiImage(p);
        if (url) return url;
      }
    }
  }

  // Attempt 4: Place
  if (card.place && String(card.place).trim() && String(card.place).trim().toLowerCase() !== 'nan') {
    url = await fetchWikiImage(String(card.place).trim());
    if (url) return url;
  }

  // Attempt 5: Subcategory + year
  if (card.subcategory && String(card.subcategory).trim()) {
    url = await fetchWikiImage(`${String(card.subcategory).trim()} ${card.year}`);
    if (url) return url;
  }

  // Attempt 6: Category generic (last resort — at least get SOMETHING thematic)
  const categoryFallbacks: Record<string, string> = {
    history: "Ancient history",
    science: "History of science",
    warfare: "Military history",
    culture: "World culture",
    people: "Historical figures",
    space: "Space exploration",
    sports: "History of sport",
    music: "Music history",
  };
  const catKey = String(card.category).toLowerCase().trim();
  if (categoryFallbacks[catKey]) {
    url = await fetchWikiImage(categoryFallbacks[catKey]);
    if (url) return url;
  }

  return null;
}

// ═══════════════════════════════════════════════
//  EDITORIAL POLISH — Better titles & descriptions
// ═══════════════════════════════════════════════

function polishTitle(headline: string): string {
  // Clean up: capitalize properly, trim excess
  let t = headline.trim();
  // Capitalize first letter of each major word
  t = t.replace(/\b\w/g, (c) => c.toUpperCase());
  // Fix common patterns: "Co Ruler" -> "Co-Ruler"
  t = t.replace(/\bCo (\w)/g, 'Co-$1');
  return t;
}

function buildShortExplanation(headline: string, description: string, year: string | number): string {
  // The description from the Excel is the editorial summary.
  // Clean it up — remove "On this day in XXXX, " prefix if present
  let text = String(description).trim();
  text = text.replace(/^On this day in \d+[,.]?\s*/i, '');
  // Capitalize first letter after cleanup
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  return text;
}

function buildContext(headline: string, description: string, year: string | number, category: string, place: string, people: string, significance: string): string {
  // Build a rich narrative context from all available data
  const parts: string[] = [];
  
  // Main narrative from description
  let mainText = String(description).trim();
  if (mainText) {
    parts.push(mainText);
  }

  // Add place context if available
  if (place && String(place).trim() && String(place).toLowerCase() !== 'nan') {
    parts.push(`This event took place in ${String(place).trim()}.`);
  }

  // Add people context if available
  if (people && String(people).trim() && String(people).toLowerCase() !== 'nan') {
    parts.push(`Key figures involved: ${String(people).trim()}.`);
  }

  // Add significance
  if (significance && String(significance).trim() && String(significance).toLowerCase() !== 'nan') {
    const sig = String(significance).trim().toLowerCase();
    if (sig === 'high') {
      parts.push('This event is considered of high historical significance, shaping the course of events that followed.');
    } else if (sig === 'medium') {
      parts.push('This event holds notable significance in its field and period.');
    }
  }

  return parts.join('\n\n');
}

// ═══════════════════════════════════════════════
//  BULK IMPORT LOGIC
// ═══════════════════════════════════════════════

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log("⚠️ Usage: npm run import-excel <path_to_file.xlsx>");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  HOXE v10 — EXCEL PIPELINE + ABSOLUTE IMAGE HUNTER  ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
  console.log(`[INFO] Detected ${rawData.length} historical events.\n`);

  const groupedByDate: Record<string, ExcelRow[]> = {};

  for (const r of rawData) {
    const row = r as ExcelRow;
    if (!row.app_date || !row.headline) continue;
    const dayRef = String(row.app_date).trim();
    if (!groupedByDate[dayRef]) groupedByDate[dayRef] = [];
    groupedByDate[dayRef].push(row);
  }

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(`${a} 2000`).getTime() - new Date(`${b} 2000`).getTime();
  });

  let globalImgSuccess = 0;
  let globalImgFail = 0;
  let globalTotal = 0;

  for (const dateString of sortedDates) {
    const cards = groupedByDate[dateString];
    console.log(`\n══ ${dateString} (${cards.length} cards) ══`);
    
    const dateObj = new Date(`${dateString} 2000`);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    let briefingId = null;
    const { data: existing } = await supabase.from("daily_briefings").select("id").eq("date", dateString).limit(1).single();
    
    if (existing) {
      console.log(`   [CLEAN] Purging old cards for ${dateString}...`);
      await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
      briefingId = existing.id;
    } else {
      const { data: root, error: rootErr } = await supabase
        .from("daily_briefings")
        .insert([{ date: dateString, day_of_week: dayOfWeek }])
        .select().single();
      if (rootErr) {
        console.error(`   ❌ Failed creating day ${dateString}:`, rootErr.message);
        continue;
      }
      briefingId = root.id;
    }

    const allItems: any[] = [];

    for (const card of cards) {
      const cat = String(card.category).toLowerCase().trim();
      const title = polishTitle(card.headline);
      const shortExp = buildShortExplanation(card.headline, card.description, card.year);
      const context = buildContext(
        card.headline, card.description, card.year, cat,
        String(card.place || ''), String(card.people_involved || ''),
        String(card.significance_level || '')
      );

      process.stdout.write(`   → [${cat}] ${title.substring(0, 40).padEnd(40)}  `);
      
      const imgUrl = await huntImage(card);
      globalTotal++;
      
      if (imgUrl) {
        globalImgSuccess++;
        console.log(`✅ IMG`);
      } else {
        globalImgFail++;
        console.log(`⚠️  NO IMG`);
      }

      allItems.push({
        briefing_id: briefingId,
        category: cat,
        title: title,
        year: String(card.year || "0"),
        short_explanation: shortExp,
        why_it_matters: context,
        image_url: imgUrl,
        image_source: imgUrl ? "Auto-Hunt: Wikipedia" : null,
        metadata_spotify_track_id: null
      });
    }

    if (allItems.length > 0) {
      const { error } = await supabase.from("briefing_items").insert(allItems);
      if (error) {
        console.error(`   ❌ DB insert error:`, error.message);
      } else {
        console.log(`   ✓ ${allItems.length} cards uploaded.`);
      }
    }
  }

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log(`║  RESULT: ${globalImgSuccess}/${globalTotal} images found (${globalImgFail} missing)`.padEnd(56) + "║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("\n✅ DATABASE FULLY UPDATED.");
}

if (typeof process !== 'undefined' && process.argv[1]) {
  main();
}
