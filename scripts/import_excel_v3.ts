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
}

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
  fallback: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=800&auto=format&fit=crop"
};

// ═══════════════════════════════════════════════
//  SMART NAME & CONTEXT EXTRACTION
// ═══════════════════════════════════════════════

function extractSearchTerms(title: string): string[] {
  const terms: string[] = [];
  terms.push(title);
  const simple = title.split(/[,:;]/)[0].trim();
  if (simple !== title && simple.length > 3) terms.push(simple);
  const birthMatch = title.match(/^Birth Of (.+)$/i);
  if (birthMatch) terms.push(birthMatch[1].trim());
  const marriageMatch = title.match(/^(.+?)\s+(?:Marries|Weds|Divorces|Files For Divorce)\s+(.+)$/i);
  if (marriageMatch) {
    terms.push(marriageMatch[1].trim().replace(/\s*\(\d+\)\s*/g, ''));
    terms.push(marriageMatch[2].trim().replace(/\s*\(\d+\)\s*/g, ''));
  }
  const cleaned = title.replace(/\s*\(\d+\)\s*/g, ' ').replace(/^(Actor|Actress|Singer|Writer|Poet|Comedian|Novelist|Designer|Model|Author|Lawyer|Explorer|President|Prime Minister|Senator|DJ|Rapper|Musician|Televangelist|Coach|Pitcher|Boxer|Cyclist|Player|American|British)\s+/i, '').trim();
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
    const t = setTimeout(() => ctrl.abort(), 6000); // Prevent hangs
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'HoxeBot/4.2' },
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
// EDITORIAL POLISH
// ═══════════════════════════════════════════════

function polishTitle(headline: string): string {
  let t = headline.trim();
  t = t.replace(/\b\w/g, (c) => c.toUpperCase());
  t = t.replace(/\bCo (\w)/g, 'Co-$1');
  return t;
}

function buildShortExplanation(description: string): string {
  let text = String(description).trim();
  text = text.replace(/^On this day in \d+[,.]?\s*/i, '');
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

function buildFallbackContext(description: string, place: string, people: string, significance: string): string {
  const parts: string[] = [];
  if (description) parts.push(String(description).trim());
  if (place && String(place).toLowerCase() !== 'nan') parts.push(`Location context: ${String(place).trim()}.`);
  if (people && String(people).toLowerCase() !== 'nan') parts.push(`Primary figures: ${String(people).trim()}.`);
  if (significance && String(significance).toLowerCase() !== 'nan') {
    const sig = String(significance).trim().toLowerCase();
    if (sig === 'high') parts.push('This occurrence radically influenced the trajectory of later events and continues to reverberate in history.');
    else if (sig === 'medium') parts.push('This constitutes a meaningful milestone within its localized or domain-specific historical spectrum.');
  }
  return parts.join('\n\n');
}

// ═══════════════════════════════════════════════
//  BULK IMPORT LOGIC
// ═══════════════════════════════════════════════

async function main() {
  const filePath = process.argv[2] || "C:\\Users\\34646\\Downloads\\april_on_this_day_database_2026.xlsx";

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  HOXE v11 — 100% IMAGE FALLBACK + RAW CONTEXT EXTRACTION   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
  const groupedByDate: Record<string, ExcelRow[]> = {};

  for (const r of rawData) {
    const row = r as any;
    const itemHeadline = row.headline || row.title;
    if (!row.app_date || !itemHeadline) continue;
    
    row.headline = itemHeadline; // normalize it so the rest of the code works
    
    const dayRef = String(row.app_date).trim();
    if (!groupedByDate[dayRef]) groupedByDate[dayRef] = [];
    groupedByDate[dayRef].push(row);
  }

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(`${a} 2000`).getTime() - new Date(`${b} 2000`).getTime());

  let globalImgSuccess = 0;
  let globalFallback = 0;
  let globalContextFetched = 0;

  for (const dateString of sortedDates) {
    const cards = groupedByDate[dateString];
    console.log(`\n══ ${dateString} (${cards.length} cards) ══`);
    
    // Create or clear the day
    let briefingId = null;
    const { data: existing } = await supabase.from("daily_briefings").select("id").eq("date", dateString).limit(1).single();
    if (existing) {
      await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
      briefingId = existing.id;
    } else {
      const dayOfWeek = new Date(`${dateString} 2000`).toLocaleDateString("en-US", { weekday: "long" });
      const { data: root } = await supabase.from("daily_briefings").insert([{ date: dateString, day_of_week: dayOfWeek }]).select().single();
      briefingId = root!.id;
    }

    const batchedItems: any[] = [];

    for (let c = 0; c < cards.length; c++) {
      const card = cards[c];
      const cat = String(card.category).toLowerCase().trim();
      const title = polishTitle(card.headline);
      const shortExp = buildShortExplanation(card.description);
      
      process.stdout.write(`   → [${cat}] ${title.substring(0, 30).padEnd(30)} `);
      
      const searchTerms = extractSearchTerms(title);
      let imgUrl = null;
      let extractText = null;
      let imageSource = null;

      // Extract context + image simultaneously
      for (const term of searchTerms) {
        const res = await fetchWikiData(term);
        if (res && res.textExtract) {
           if (!extractText) extractText = res.textExtract; // Keep the best text we find
           if (res.imgUrl) {
              imgUrl = res.imgUrl;
              imageSource = "Auto-Hunt: Wikipedia";
              break; 
           }
        }
      }

      // If text failed, use fallback text
      let finalContext = extractText ? `${extractText}\n\n${buildFallbackContext(card.description, String(card.place||''), String(card.people_involved||''), String(card.significance_level||''))}` : buildFallbackContext(card.description, String(card.place||''), String(card.people_involved||''), String(card.significance_level||''));

      // If image failed, use 100% Guaranteed Unsplash Fallbacks
      if (imgUrl) {
        globalImgSuccess++;
        process.stdout.write(" [Wiki Image] ");
      } else {
        globalFallback++;
        imgUrl = STATIC_FALLBACKS[cat] || STATIC_FALLBACKS["fallback"];
        imageSource = "Auto-Hunt: Universal Concept Fallback";
        process.stdout.write(" [Unsplash Fallback] ");
      }

      if (extractText) {
        globalContextFetched++;
        console.log(" [Rich Context 📖]");
      } else {
        console.log(" [Standard Context]");
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
        metadata_spotify_track_id: null
      });

      // Avoid Wikipedia 429 Too Many Requests
      await new Promise(r => setTimeout(r, 600)); 
    }

    if (batchedItems.length > 0) {
      console.log(`\n  ⏳ Translating ${batchedItems.length} items to ES + GL via Azure...`);
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
        for (let i = 0; i < batchedItems.length; i += BATCH_SIZE) {
          const batch = batchedItems.slice(i, i + BATCH_SIZE);
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

      await supabase.from("briefing_items").insert(batchedItems);
    }
  }

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log(`║  FINISHED. Built 100% Coverage Database.              ║`);
  console.log(`║  Wiki Images: ${globalImgSuccess} | Unsplash Fallbacks: ${globalFallback}       ║`);
  console.log(`║  Rich Wikipedia Contexts Extracted: ${globalContextFetched}             ║`);
  console.log("╚═══════════════════════════════════════════════════════╝");
}

main();
