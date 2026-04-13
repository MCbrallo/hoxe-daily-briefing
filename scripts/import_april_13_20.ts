/**
 * HOXE v13 — BULK IMPORT: April 13–20 (EXCEL BASED)
 * 
 * Reads the Excel file: on_this_day_april_13_20.xlsx
 * Pushes everything to Supabase with:
 *   - CLEARING ANY EXISTING DAILY BRIEFINGS FIRST (Clean slate)
 *   - Wikipedia images + rich context extraction
 *   - Unsplash category fallbacks
 *   - YouTube music resolution
 *   - Azure translation (ES+GL)
 */

import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY!;
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || "global";

if (!SUPABASE_URL || !SUPABASE_KEY || !AZURE_KEY) {
  console.error("❌ Missing Supabase or Azure credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  viral_scandal: "https://images.unsplash.com/photo-1504711434969-e33886168d6c?q=80&w=800&auto=format&fit=crop",
  viral_record: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=800&auto=format&fit=crop",
  viral_music: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop",
  viral_moment: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?q=80&w=800&auto=format&fit=crop",
  viral_movie: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
  fallback: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=800&auto=format&fit=crop"
};

const VIRAL_TYPE_MAP: Record<string, string> = {
  scandal_or_drama: "viral_scandal",
  world_record: "viral_record",
  music_number_1: "viral_music",
  viral_moment: "viral_moment",
  movie_premiere: "viral_movie",
};

const YOUTUBE_FALLBACK_TRACKS = ["fJ9rUzIMcZQ", "YkgkThdzX-8", "gGdGFtwCNBE", "dQw4w9WgXcQ", "8UVNT4wvIGY", "kJQP7kiw5Fk"];
let fbIndex = 0;
function getYtFb() { return YOUTUBE_FALLBACK_TRACKS[fbIndex++ % YOUTUBE_FALLBACK_TRACKS.length]; }

function extractSearchTerms(title: string): string[] {
  const terms: string[] = [title];
  const simple = title.split(/[,:;]/)[0].trim();
  if (simple !== title && simple.length > 3) terms.push(simple);
  const properNouns = title.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  if (properNouns) {
    for (const pn of properNouns.slice(0, 3)) {
      if (pn.length > 4) terms.push(pn);
    }
  }
  return [...new Set(terms)];
}

async function fetchWikiData(query: string): Promise<any> {
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'HoxeBot/5.0' }, signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      let img = null;
      if (data.thumbnail?.source) img = data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
      else if (data.originalimage?.source) img = data.originalimage.source;
      return { imgUrl: img, textExtract: data.extract || null };
    }
  } catch {}
  return null;
}

async function resolveYoutubeId(title: string): Promise<string | null> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:youtube.com/watch "${title}"`)}`;
    const res = await fetch(url, { headers: { "User-Agent": "HoxeBot/4.0" } });
    const html = await res.text();
    const match = html.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function batchTranslate(texts: string[]): Promise<{ es: string; gl: string }[]> {
  const body = texts.map(t => ({ Text: (t || "").substring(0, 10000) }));
  const res = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es&to=gl`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Ocp-Apim-Subscription-Region": AZURE_REGION, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.map((item: any) => ({
    es: item.translations?.find((t: any) => t.to === "es")?.text || "",
    gl: item.translations?.find((t: any) => t.to === "gl")?.text || "",
  }));
}

function polishTitle(headline: string): string {
  let t = headline.trim();
  t = t.replace(/\b\w/g, (c) => c.toUpperCase());
  return t;
}

function cutInHalf(text: string | null): string {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 2) return text;
  const keepCount = Math.floor(sentences.length * 0.45);
  return sentences.slice(0, Math.max(2, keepCount)).join(" ").trim();
}

async function main() {
  const filePath = "C:\\Users\\34646\\Downloads\\on_this_day_april_13_20.xlsx";
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║ HOXE v13 — APRIL 13–20 EXCEL TO DB (CLEAN SLATE & TRANSLATE) ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const workbook = xlsx.readFile(filePath);
  const dailyRows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets["Daily_Events"] || workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
  const viralRows: any[] = workbook.Sheets["Viral"] ? xlsx.utils.sheet_to_json(workbook.Sheets["Viral"], { defval: "" }) : [];
  
  console.log(`📄 Loaded ${dailyRows.length} daily events and ${viralRows.length} virals.`);

  const allDates = new Set<string>();
  for (const r of [...dailyRows, ...viralRows]) if (r.app_date) allDates.add(String(r.app_date).trim());
  const sortedDates = [...allDates].sort((a, b) => new Date(`${a} 2000`).getTime() - new Date(`${b} 2000`).getTime());

  // Delete ALL existing daily briefings for a clean slate
  console.log("🧹 Wiping completely the existing daily_briefings to replace current content...");
  const { data: oldDays } = await supabase.from("daily_briefings").select("id");
  if (oldDays && oldDays.length > 0) {
    for (const d of oldDays) {
      await supabase.from("briefing_items").delete().eq("briefing_id", d.id);
      await supabase.from("daily_briefings").delete().eq("id", d.id);
    }
    console.log(`✅ Emptied ${oldDays.length} existing days from the database.`);
  }

  for (const dateString of sortedDates) {
    const dayRows = dailyRows.filter(r => String(r.app_date).trim() === dateString);
    const vRows = viralRows.filter(r => String(r.app_date).trim() === dateString);
    console.log(`\n══ GENERATING: ${dateString} (${dayRows.length + vRows.length} items) ══`);

    let targetDate = new Date(`${dateString} 2026`);
    if (isNaN(targetDate.getTime())) targetDate = new Date();
    const dayOfWeek = targetDate.toLocaleDateString("en-US", { weekday: "long" });

    const { data: root, error: rootErr } = await supabase.from("daily_briefings").insert([{ date: dateString, day_of_week: dayOfWeek }]).select().single();
    if (rootErr || !root) { console.error("Failed to create day:", rootErr); continue; }
    
    const batchedItems: any[] = [];

    // Editorials
    for (const card of dayRows) {
      const cat = String(card.category).toLowerCase().trim();
      const title = polishTitle(card.title || card.headline || "");
      let imgUrl: string | null = null;
      let context = (card.description || "").trim();

      for (const term of extractSearchTerms(title)) {
        const res = await fetchWikiData(term);
        if (res) { if (!imgUrl) imgUrl = res.imgUrl; if (!context) context = res.textExtract; }
      }

      let musicMeta: string | null = null;
      if (cat === "music") {
        let ytId = await resolveYoutubeId((card.song_to_add || title) + " official video");
        if (!ytId) ytId = getYtFb();
        musicMeta = ytId;
      }

      batchedItems.push({
        briefing_id: root.id, category: cat, title, year: String(card.year || "0"),
        short_explanation: String(card.subtitle || card.description || "").trim(),
        why_it_matters: cutInHalf(context), // Truncated to <50% before processing!
        image_url: imgUrl,
        image_source: imgUrl ? "Wikipedia" : null,
        metadata_spotify_track_id: musicMeta
      });
      process.stdout.write(".");
    }

    // Virals
    for (const viral of vRows) {
      const viralType = String(viral.viral_type || "").toLowerCase().trim();
      const dbCat = VIRAL_TYPE_MAP[viralType] || "viral_moment";
      const title = polishTitle(viral.title || "");
      let imgUrl: string | null = null;
      let context = (viral.description || "").trim();

      for (const term of extractSearchTerms(title)) {
        const res = await fetchWikiData(term);
        if (res) { if (!imgUrl) imgUrl = res.imgUrl; if (!context) context = res.textExtract; }
      }

      let musicMeta: string | null = null;
      if (dbCat === "viral_music" && (viral.artist || viral.song_title)) {
        let ytId = await resolveYoutubeId(`${viral.artist} ${viral.song_title} official`);
        if (!ytId) ytId = getYtFb();
        musicMeta = ytId;
      }

      batchedItems.push({
        briefing_id: root.id, category: dbCat, title, year: String(viral.year || "0"),
        short_explanation: String(viral.subtitle || viral.description || "").trim(),
        why_it_matters: cutInHalf(context), // Truncated to <50% before processing!
        image_url: imgUrl,
        image_source: imgUrl ? "Wikipedia" : null,
        metadata_spotify_track_id: musicMeta
      });
      process.stdout.write("*");
    }

    // Filter images: only keep 3 Wikipedia images! No Unsplash fallbacks.
    let wpImages = batchedItems.filter(i => i.image_url && i.image_source === "Wikipedia");
    wpImages = wpImages.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const item of batchedItems) {
      if (!wpImages.includes(item)) {
        item.image_url = null;
        item.image_source = null;
      }
    }

    console.log(`\n  ⏳ Translating ${batchedItems.length} items to ES + GL...`);
    const BS = 4;
    for (let i = 0; i < batchedItems.length; i += BS) {
      const batch = batchedItems.slice(i, i + BS);
      try {
        const texts = batch.flatMap(it => [it.title || "", it.short_explanation || "", it.why_it_matters || ""]);
        const res = await batchTranslate(texts);
        for (let j = 0; j < batch.length; j++) {
          const t = j * 3;
          batch[j].title_es = res[t].es; batch[j].title_gl = res[t].gl;
          batch[j].short_explanation_es = res[t+1].es; batch[j].short_explanation_gl = res[t+1].gl;
          batch[j].why_it_matters_es = res[t+2].es; batch[j].why_it_matters_gl = res[t+2].gl;
        }
      } catch (e: any) { console.error(`\nTranslate ERR: ${e.message}`); }
    }

    const { error } = await supabase.from("briefing_items").insert(batchedItems);
    if (error) console.error("   ❌ Insert error:", error);
    else console.log(`   ✅ Inserted ${batchedItems.length} items with max 3 images.`);
  }
}

main().catch(console.error);
