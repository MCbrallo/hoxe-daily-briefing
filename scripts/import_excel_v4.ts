import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STATIC_FALLBACKS: Record<string, string> = {
  history: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop",
  science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
  physics: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop",
  warfare: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop",
  music: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
  "viral_music": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
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
  fallback: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=800&auto=format&fit=crop"
};

function extractSearchTerms(title: string): string[] {
  const terms: string[] = [];
  terms.push(title);
  const simple = title.split(/[,:;]/)[0].trim();
  if (simple !== title && simple.length > 3) terms.push(simple);
  const cleaned = title.replace(/\s*\(\d+\)\s*/g, ' ').replace(/^(Actor|Actress|Singer|Writer|Poet|Comedian|Novelist|Designer|Model|Author|Lawyer|Explorer|President|Prime Minister|Senator|DJ|Rapper|Musician|Televangelist|Coach|Pitcher|Boxer|Cyclist|Player|American|British)\s+/i, '').trim();
  if (cleaned !== title) terms.push(cleaned);
  return [...new Set(terms)];
}

async function fetchWikiData(query: string): Promise<any | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'HoxeBot/4.2' },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      let img = null;
      let text = data.extract || null;
      if (data.thumbnail?.source) img = data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
      else if (data.originalimage?.source) img = data.originalimage.source;
      return { imgUrl: img, textExtract: text };
    }
  } catch {}
  return null;
}

// 60% Truncation Limit (Keeps exactly 40%)
function strictTruncate(text: string | null): string | null {
  if (!text) return null;
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text;
  if (sentences.length <= 2) return text;
  const keepCount = Math.max(2, Math.ceil(sentences.length * 0.40));
  return sentences.slice(0, keepCount).join(" ").trim();
}

function polishTitle(headline: string): string {
  let t = headline.trim();
  t = t.replace(/\b\w/g, (c) => c.toUpperCase());
  t = t.replace(/\bCo (\w)/g, 'Co-$1');
  return t;
}

async function searchDeezer(artist: string, track: string): Promise<any | null> {
  try {
    const q = artist ? `artist:"${artist}" track:"${track}"` : track;
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return { deezerId: String(data.data[0].id) };
      }
    }
  } catch(e) {}
  return null;
}

async function main() {
  const filePath = process.argv[2] || "C:\\Users\\34646\\Downloads\\on_this_day_april_20_26_flat.xlsx";
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  HOXE v4 — UNIFIED SCRIPT (SUBTITLE + 60% TRUNC + SPOTIFY) ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
  const groupedByDate: Record<string, any[]> = {};

  for (const row of rawData) {
    const itemHeadline = row.headline || row.title;
    const dayRef = String(row.app_date || row.event_date).trim();
    if (!dayRef || !itemHeadline) continue;
    
    row.title = itemHeadline; 
    if (!groupedByDate[dayRef]) groupedByDate[dayRef] = [];
    groupedByDate[dayRef].push(row);
  }

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(`${a} 2000`).getTime() - new Date(`${b} 2000`).getTime());

  for (const dateString of sortedDates) {
    const cards = groupedByDate[dateString];
    console.log(`\n══ ${dateString} (${cards.length} cards) ══`);
    
    let briefingId = null;
    const { data: existing } = await supabase.from("daily_briefings").select("id").eq("date", dateString).limit(1).single();
    if (existing) {
      await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
      briefingId = existing.id;
    } else {
      const dayOfWeek = new Date(`${dateString} 2026`).toLocaleDateString("en-US", { weekday: "long" });
      const { data: root } = await supabase.from("daily_briefings").insert([{ date: dateString, day_of_week: dayOfWeek }]).select().single();
      briefingId = root!.id;
    }

    const batchedItems: any[] = [];

    for (let c = 0; c < cards.length; c++) {
      const card = cards[c];
      const cat = String(card.category).toLowerCase().trim();
      const title = polishTitle(card.title);
      // BUG FIX 1: Proper Subtitle extraction
      const shortExp = card.subtitle ? String(card.subtitle).trim() : String(card.description).trim().split('.')[0] + '.';
      
      process.stdout.write(`   → [${cat}] ${title.substring(0, 30).padEnd(30)} `);
      
      const searchTerms = extractSearchTerms(title);
      let imgUrl = null;
      let extractText = null;
      let imageSource = null;

      for (const term of searchTerms) {
        const res = await fetchWikiData(term);
        if (res && res.textExtract) {
           if (!extractText) extractText = strictTruncate(res.textExtract); // BUG FIX 2: Strict Truncation directly from Wikipedia
           if (res.imgUrl) { imgUrl = res.imgUrl; imageSource = "Wikipedia"; break; }
        }
      }

      let descriptionText = strictTruncate(String(card.description).trim());
      let finalContext = extractText ? `${extractText}\n\n${descriptionText}` : descriptionText;
      
      // Unsplash fallbacks removed per user request: max 3 images strictly from Wikipedia

      // BUG FIX 3: Spotify / Deezer Meta extraction
      let musicMeta: string | null = null;
      const songId = String(card.song_id || card.spotify_track_id || "").trim();
      const songToAdd = String(card.song_to_add || "").trim();
      if (songId) {
        musicMeta = JSON.stringify({ deezerId: songId });
      } else if (songToAdd && cat.includes("music")) {
         const dz = await searchDeezer("", songToAdd);
         if(dz) musicMeta = JSON.stringify(dz);
      }

      batchedItems.push({
        briefing_id: briefingId,
        category: cat,
        title: title,
        year: String(card.year || "0"),
        short_explanation: shortExp,
        why_it_matters: finalContext,
        image_url: imgUrl,
        image_source: imageSource,
        metadata_spotify_track_id: musicMeta
      });

      await new Promise(r => setTimeout(r, 400));
    }

    if (batchedItems.length > 0) {
      const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
      const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || "global";
      if (!AZURE_KEY) {
        console.warn("  ⚠ Missing AZURE_TRANSLATOR_KEY.");
      } else {
        const batchTranslate = async (texts: string[]) => {
          const body = texts.map(t => ({ Text: (t || "").substring(0, 10000) }));
          const res = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es&to=gl`, {
            method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Ocp-Apim-Subscription-Region": AZURE_REGION, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          return data.map((item: any) => ({ es: item.translations?.find((t: any) => t.to === "es")?.text || "", gl: item.translations?.find((t: any) => t.to === "gl")?.text || "" }));
        };

        const BATCH_SIZE = 4;
        for (let i = 0; i < batchedItems.length; i += BATCH_SIZE) {
          const batch = batchedItems.slice(i, i + BATCH_SIZE);
          try {
            const texts = batch.flatMap(item => [item.title || "", item.short_explanation || "", item.why_it_matters || ""]);
            const results = await batchTranslate(texts);
            for (let j = 0; j < batch.length; j++) {
              batch[j].title_es = results[j*3].es; batch[j].title_gl = results[j*3].gl;
              batch[j].short_explanation_es = results[j*3+1].es; batch[j].short_explanation_gl = results[j*3+1].gl;
              batch[j].why_it_matters_es = results[j*3+2].es; batch[j].why_it_matters_gl = results[j*3+2].gl;
            }
            await new Promise(r => setTimeout(r, 500)); // Lower delay
          } catch (err: any) { console.error(`  ✗ Translation fail`); }
        }
      }
      await supabase.from("briefing_items").insert(batchedItems);
      console.log(`  ✓ Inserted ${batchedItems.length} items`);
    }
  }
}
main();
