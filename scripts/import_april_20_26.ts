/**
 * HOXE v12 — BULK IMPORT: April 20–26
 * 
 * Reads the Excel file with Daily_Events and Viral sheets,
 * pushes everything to Supabase with:
 *   - Wikipedia images + rich context extraction
 *   - Unsplash category fallbacks for 100% image coverage
 *   - Viral category mapping (viral_type → viral_category)
 *   - Music metadata (Deezer) when song_id is present
 */

import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════
// FALLBACK UNSPLASH IMAGES
// ═══════════════════════════════════════════════
const STATIC_FALLBACKS: Record<string, string> = {
  history: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop",
  science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
  physics: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop",
  "biology and medicine": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=800&auto=format&fit=crop",
  warfare: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop",
  music: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
  "politics and government": "https://images.unsplash.com/photo-1528646960144-839556be0eac?q=80&w=800&auto=format&fit=crop",
  "film and television": "https://images.unsplash.com/photo-1485001564903-56e6a54d46ce?q=80&w=800&auto=format&fit=crop",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop",
  people: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop",
  "art and architecture": "https://images.unsplash.com/photo-1518998053401-a4309c855a82?q=80&w=800&auto=format&fit=crop",
  "business and economy": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  philosophy: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800&auto=format&fit=crop",
  literature: "https://images.unsplash.com/photo-1455390582262-044cdead2708?q=80&w=800&auto=format&fit=crop",
  exploration: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop",
  religion: "https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=800&auto=format&fit=crop",
  law: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
  environment: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  space: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=800&auto=format&fit=crop",
  // Viral-specific fallbacks
  viral_scandal: "https://images.unsplash.com/photo-1504711434969-e33886168d6c?q=80&w=800&auto=format&fit=crop",
  viral_record: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=800&auto=format&fit=crop",
  viral_music: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop",
  viral_moment: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?q=80&w=800&auto=format&fit=crop",
  viral_movie: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
  fallback: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=800&auto=format&fit=crop"
};

// ═══════════════════════════════════════════════
// VIRAL TYPE → DB CATEGORY MAPPING
// ═══════════════════════════════════════════════
const VIRAL_TYPE_MAP: Record<string, string> = {
  scandal_or_drama: "viral_scandal",
  world_record: "viral_record",
  music_number_1: "viral_music",
  viral_moment: "viral_moment",
  movie_premiere: "viral_movie",
};

// ═══════════════════════════════════════════════
// SMART NAME & CONTEXT EXTRACTION
// ═══════════════════════════════════════════════

function extractSearchTerms(title: string): string[] {
  const terms: string[] = [];
  terms.push(title);
  const simple = title.split(/[,:;]/)[0].trim();
  if (simple !== title && simple.length > 3) terms.push(simple);
  const birthMatch = title.match(/^Birth Of (.+)$/i);
  if (birthMatch) terms.push(birthMatch[1].trim());
  const cleaned = title
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/^(Actor|Actress|Singer|Writer|Poet|Comedian|Novelist|Designer|Model|Author|Lawyer|Explorer|President|Prime Minister|Senator|DJ|Rapper|Musician|Televangelist|Coach|Pitcher|Boxer|Cyclist|Player|American|British)\s+/i, '')
    .trim();
  if (cleaned !== title) terms.push(cleaned);
  const properNouns = title.replace(/\s*\(\d+\)\s*/g, ' ').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  if (properNouns) {
    for (const pn of properNouns.slice(0, 3)) {
      if (pn.length > 4 && !['Birth Of', 'The First', 'The Last'].includes(pn)) terms.push(pn);
    }
  }
  return [...new Set(terms)];
}

interface WikiResult {
  imgUrl: string | null;
  textExtract: string | null;
}

async function fetchWikiData(query: string): Promise<WikiResult | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'HoxeBot/5.0' },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      let img = null;
      let text = data.extract || null;
      if (data.thumbnail?.source) {
        img = data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
      } else if (data.originalimage?.source) {
        img = data.originalimage.source;
      }
      return { imgUrl: img, textExtract: text };
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════════
// DEEZER SEARCH FOR MUSIC CARDS
// ═══════════════════════════════════════════════

interface DeezerTrack {
  deezerId: string;
  deezerTitle: string;
  deezerArtist: string;
  deezerCover: string;
  deezerPreview: string;
}

async function searchDeezer(artist: string, songTitle: string): Promise<DeezerTrack | null> {
  try {
    const query = `${artist} ${songTitle}`.trim();
    if (!query) return null;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`, {
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const track = data.data[0];
        return {
          deezerId: String(track.id),
          deezerTitle: track.title || songTitle,
          deezerArtist: track.artist?.name || artist,
          deezerCover: track.album?.cover_big || track.album?.cover_medium || "",
          deezerPreview: track.preview || ""
        };
      }
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════════
// EDITORIAL POLISH
// ═══════════════════════════════════════════════

function polishTitle(headline: string): string {
  let t = headline.trim();
  // Capitalize first letter of each word but preserve natural casing
  t = t.replace(/\b\w/g, (c) => c.toUpperCase());
  return t;
}

function buildFallbackContext(description: string, place: string, people: string, significance: string): string {
  const parts: string[] = [];
  if (description) parts.push(String(description).trim());
  if (place && String(place).toLowerCase() !== 'nan' && String(place).trim()) parts.push(`Location context: ${String(place).trim()}.`);
  if (people && String(people).toLowerCase() !== 'nan' && String(people).trim()) parts.push(`Primary figures: ${String(people).trim()}.`);
  if (significance && String(significance).toLowerCase() !== 'nan') {
    const sig = String(significance).trim().toLowerCase();
    if (sig === 'high' || sig === 'global') parts.push('This occurrence radically influenced the trajectory of later events and continues to reverberate in history.');
    else if (sig === 'medium') parts.push('This constitutes a meaningful milestone within its localized or domain-specific historical spectrum.');
  }
  return parts.join('\n\n');
}

// ═══════════════════════════════════════════════
//  MAIN IMPORT LOGIC
// ═══════════════════════════════════════════════

async function main() {
  const filePath = process.argv[2] || "C:\\Users\\34646\\Downloads\\on_this_day_april_20_26.xlsx";

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  HOXE v12 — APRIL 20–26 BULK IMPORT (Daily + Viral + Music) ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const workbook = xlsx.readFile(filePath);

  // ──────────────────────────────────────────────
  //  PARSE DAILY_EVENTS SHEET
  // ──────────────────────────────────────────────
  const dailySheet = workbook.Sheets["Daily_Events"];
  const dailyRows: any[] = xlsx.utils.sheet_to_json(dailySheet, { defval: "" });
  console.log(`📄 Daily_Events: ${dailyRows.length} rows loaded`);

  // ──────────────────────────────────────────────
  //  PARSE VIRAL SHEET
  // ──────────────────────────────────────────────
  const viralSheet = workbook.Sheets["Viral"];
  const viralRows: any[] = xlsx.utils.sheet_to_json(viralSheet, { defval: "" });
  console.log(`🔥 Viral: ${viralRows.length} rows loaded\n`);

  // Group everything by date
  const allDates = new Set<string>();
  for (const r of dailyRows) { if (r.app_date) allDates.add(String(r.app_date).trim()); }
  for (const r of viralRows) { if (r.app_date) allDates.add(String(r.app_date).trim()); }

  const sortedDates = [...allDates].sort((a, b) => new Date(`${a} 2000`).getTime() - new Date(`${b} 2000`).getTime());

  let stats = { wikiImg: 0, fallbackImg: 0, richContext: 0, deezerFound: 0, totalCards: 0 };

  for (const dateString of sortedDates) {
    const dayDailyRows = dailyRows.filter(r => String(r.app_date).trim() === dateString);
    const dayViralRows = viralRows.filter(r => String(r.app_date).trim() === dateString);
    const totalCards = dayDailyRows.length + dayViralRows.length;

    console.log(`\n══════════════════════════════════════════════`);
    console.log(`  ${dateString} — ${dayDailyRows.length} daily + ${dayViralRows.length} viral = ${totalCards} cards`);
    console.log(`══════════════════════════════════════════════`);

    // Create or clear the day
    let briefingId: string;
    const { data: existing } = await supabase
      .from("daily_briefings")
      .select("id")
      .eq("date", dateString)
      .limit(1)
      .single();

    if (existing) {
      // Clear existing items for this day
      await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
      briefingId = existing.id;
      console.log(`  ♻️  Cleared existing day (${briefingId})`);
    } else {
      const dayOfWeek = new Date(`${dateString} 2026`).toLocaleDateString("en-US", { weekday: "long" });
      const { data: root, error: insertErr } = await supabase
        .from("daily_briefings")
        .insert([{ date: dateString, day_of_week: dayOfWeek }])
        .select()
        .single();
      if (insertErr || !root) {
        console.error(`  ❌ Failed to create briefing for ${dateString}:`, insertErr);
        continue;
      }
      briefingId = root.id;
      console.log(`  ✅ Created new day (${briefingId})`);
    }

    const batchedItems: any[] = [];

    // ── PROCESS DAILY EVENTS ──
    for (let c = 0; c < dayDailyRows.length; c++) {
      const card = dayDailyRows[c];
      const cat = String(card.category).toLowerCase().trim();
      const title = polishTitle(card.title || card.headline || "");
      const subtitle = String(card.subtitle || card.description || "").trim();
      const description = String(card.description || "").trim();

      process.stdout.write(`   [${(c + 1).toString().padStart(2, '0')}] [${cat.padEnd(22)}] ${title.substring(0, 40).padEnd(40)} `);

      // Wikipedia image + context extraction
      const searchTerms = extractSearchTerms(title);
      let imgUrl: string | null = null;
      let extractText: string | null = null;
      let imageSource: string | null = null;

      for (const term of searchTerms) {
        const res = await fetchWikiData(term);
        if (res && res.textExtract) {
          if (!extractText) extractText = res.textExtract;
          if (res.imgUrl) {
            imgUrl = res.imgUrl;
            imageSource = "Wikipedia";
            break;
          }
        }
      }

      // Build rich context
      let finalContext = extractText
        ? `${extractText}\n\n${buildFallbackContext(description, String(card.place || ''), String(card.people_involved || ''), String(card.significance_level || ''))}`
        : buildFallbackContext(description, String(card.place || ''), String(card.people_involved || ''), String(card.significance_level || ''));

      // Image fallback
      if (imgUrl) {
        stats.wikiImg++;
        process.stdout.write("[Wiki 📷] ");
      } else {
        stats.fallbackImg++;
        imgUrl = STATIC_FALLBACKS[cat] || STATIC_FALLBACKS["fallback"];
        imageSource = "Unsplash";
        process.stdout.write("[Unsplash] ");
      }

      if (extractText) {
        stats.richContext++;
        process.stdout.write("[Rich 📖]");
      } else {
        process.stdout.write("[Standard]");
      }

      // Check for music metadata (song_id column)
      let musicMeta: string | null = null;
      const songId = String(card.song_id || "").trim();
      const songToAdd = String(card.song_to_add || "").trim();
      
      if (songId) {
        // song_id is provided directly — use as Deezer ID
        musicMeta = JSON.stringify({ deezerId: songId });
        stats.deezerFound++;
        process.stdout.write(" [🎵 Deezer]");
      } else if (cat === "music" && songToAdd) {
        // Try Deezer search for music category items with a song suggestion
        const deezerResult = await searchDeezer("", songToAdd);
        if (deezerResult) {
          musicMeta = JSON.stringify(deezerResult);
          stats.deezerFound++;
          process.stdout.write(" [🎵 Deezer Search]");
        }
      }

      console.log("");

      batchedItems.push({
        briefing_id: briefingId,
        category: cat,
        title: title,
        year: String(card.year || "0"),
        short_explanation: subtitle,
        why_it_matters: finalContext,
        image_url: imgUrl,
        image_source: imageSource,
        metadata_spotify_track_id: musicMeta
      });

      stats.totalCards++;
      
      // Avoid Wikipedia 429 Too Many Requests
      await new Promise(r => setTimeout(r, 500));
    }

    // ── PROCESS VIRAL ITEMS ──
    for (let v = 0; v < dayViralRows.length; v++) {
      const viral = dayViralRows[v];
      const viralType = String(viral.viral_type || "").toLowerCase().trim();
      const dbCategory = VIRAL_TYPE_MAP[viralType] || "viral_moment";
      const title = polishTitle(viral.title || "");
      const subtitle = String(viral.subtitle || viral.description || "").trim();
      const description = String(viral.description || "").trim();

      process.stdout.write(`   [V${(v + 1).toString().padStart(1)}] [${dbCategory.padEnd(22)}] ${title.substring(0, 40).padEnd(40)} `);

      // Wikipedia image + context for viral items too
      const searchTerms = extractSearchTerms(title);
      let imgUrl: string | null = null;
      let extractText: string | null = null;
      let imageSource: string | null = null;

      for (const term of searchTerms) {
        const res = await fetchWikiData(term);
        if (res && res.textExtract) {
          if (!extractText) extractText = res.textExtract;
          if (res.imgUrl) {
            imgUrl = res.imgUrl;
            imageSource = "Wikipedia";
            break;
          }
        }
      }

      let finalContext = extractText
        ? `${extractText}\n\n${description}`
        : description;

      if (imgUrl) {
        stats.wikiImg++;
        process.stdout.write("[Wiki 📷] ");
      } else {
        stats.fallbackImg++;
        imgUrl = STATIC_FALLBACKS[dbCategory] || STATIC_FALLBACKS["fallback"];
        imageSource = "Unsplash";
        process.stdout.write("[Unsplash] ");
      }

      if (extractText) {
        stats.richContext++;
        process.stdout.write("[Rich 📖]");
      } else {
        process.stdout.write("[Standard]");
      }

      // Music metadata for viral music items
      let musicMeta: string | null = null;
      const songId = String(viral.song_id || "").trim();
      const artist = String(viral.artist || "").trim();
      const songTitle = String(viral.song_title || "").trim();
      
      if (songId) {
        musicMeta = JSON.stringify({ deezerId: songId });
        stats.deezerFound++;
        process.stdout.write(" [🎵 Direct ID]");
      } else if (viralType === "music_number_1" && (artist || songTitle)) {
        // Auto-search Deezer for music #1 viral cards
        const deezerResult = await searchDeezer(artist, songTitle);
        if (deezerResult) {
          musicMeta = JSON.stringify(deezerResult);
          stats.deezerFound++;
          process.stdout.write(" [🎵 Deezer Hit]");
        } else {
          process.stdout.write(" [🎵 No Deezer]");
        }
      }

      console.log("");

      batchedItems.push({
        briefing_id: briefingId,
        category: dbCategory,
        title: title,
        year: String(viral.year || "0"),
        short_explanation: subtitle,
        why_it_matters: finalContext,
        image_url: imgUrl,
        image_source: imageSource,
        metadata_spotify_track_id: musicMeta
      });

      stats.totalCards++;
      await new Promise(r => setTimeout(r, 500));
    }

    // Batch insert all items for this day
    if (batchedItems.length > 0) {
      const { error: insertError } = await supabase.from("briefing_items").insert(batchedItems);
      if (insertError) {
        console.error(`  ❌ Insert error for ${dateString}:`, insertError.message);
      } else {
        console.log(`  ✅ Inserted ${batchedItems.length} items for ${dateString}`);
      }
    }
  }

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log(`║  IMPORT COMPLETE                                          ║`);
  console.log(`║  Total Cards: ${String(stats.totalCards).padEnd(6)}                                ║`);
  console.log(`║  Wiki Images: ${String(stats.wikiImg).padEnd(6)} | Unsplash Fallbacks: ${String(stats.fallbackImg).padEnd(6)} ║`);
  console.log(`║  Rich Wikipedia Contexts: ${String(stats.richContext).padEnd(6)}                   ║`);
  console.log(`║  Deezer Music Tracks: ${String(stats.deezerFound).padEnd(6)}                       ║`);
  console.log("╚═══════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
