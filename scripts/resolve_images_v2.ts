/**
 * HOXE IMAGE RESOLVER v2 — Multi-Strategy Per-Card Image Resolution
 * 
 * For each card in the database (April 20–26), this script:
 * 1. Searches Wikipedia REST API with multiple query variations
 * 2. Falls back to Wikimedia Commons search for specific historical images
 * 3. Extracts people names, places, and events for targeted searches
 * 4. Updates Supabase with the best match found
 * 
 * Goal: 100% relevant, personalized images — zero generic fallbacks.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ═══════════════════════════════════════════════
// WIKIPEDIA REST API — Article Summary Images  
// ═══════════════════════════════════════════════

async function wikiSummaryImage(query: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'HoxeImageResolver/2.0' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail?.source) {
        return data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
      }
      if (data.originalimage?.source) {
        return data.originalimage.source;
      }
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════════
// WIKIPEDIA SEARCH API — Find best article match
// ═══════════════════════════════════════════════

async function wikiSearchImage(query: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HoxeImageResolver/2.0' },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const p of Object.values(pages) as any[]) {
          if (p.thumbnail?.source) {
            return p.thumbnail.source;
          }
        }
      }
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════════
// WIKIMEDIA COMMONS SEARCH — Broader image search
// ═══════════════════════════════════════════════

async function commonsSearchImage(query: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HoxeImageResolver/2.0' },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const p of Object.values(pages) as any[]) {
          const info = p.imageinfo?.[0];
          if (info) {
            // Prefer the thumbnail URL if available, otherwise use full URL
            return info.thumburl || info.url;
          }
        }
      }
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════════
// QUERY GENERATION — Extract search terms from card
// ═══════════════════════════════════════════════

function generateSearchQueries(title: string, category: string, description?: string): string[] {
  const queries: string[] = [];
  
  // 1. Direct title (cleaned)
  const cleanTitle = title
    .replace(/\bIs\b/g, 'is')
    .replace(/\bThe\b/g, 'the')
    .replace(/\bAt\b/g, 'at')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bIn\b/g, 'in')
    .replace(/\bA\b/g, 'a')
    .replace(/\bAn\b/g, 'an')
    .replace(/\bFor\b/g, 'for')
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOn\b/g, 'on')
    .replace(/\bTo\b/g, 'to')
    .replace(/\bBy\b/g, 'by')
    .replace(/'S\b/g, "'s")
    .trim();
  
  // 2. Person name patterns
  const bornMatch = title.match(/^(.+?)\s+is\s+Born$/i);
  const diesMatch = title.match(/^(.+?)\s+Dies$/i);
  const personName = bornMatch?.[1]?.trim() || diesMatch?.[1]?.trim();
  
  if (personName) {
    queries.push(personName);  // Best: direct person name
    queries.push(`${personName} portrait`);  // Good: portrait search
  }
  
  // 3. Event-specific queries
  queries.push(cleanTitle);
  
  // 4. Extract proper nouns (multi-word capitalized phrases)
  const properNouns = title.match(/\b[A-Z][a-z]+(?:\s+(?:of|the|and|in|at|de|von|van|du|la|le|el|del|das|der|dos|di)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
  if (properNouns) {
    for (const pn of properNouns) {
      if (pn.length > 4 && !['Is Born', 'The First', 'The Last', 'The Top', 'The UK', 'Number One'].includes(pn)) {
        queries.push(pn);
      }
    }
  }
  
  // 5. First part of title (before comma/dash)
  const firstPart = title.split(/[,–—]/)[0].trim();
  if (firstPart !== title && firstPart.length > 5) {
    queries.push(firstPart);
  }
  
  // 6. Category-specific enrichment
  if (category.includes("warfare") || category.includes("battle")) {
    const battleMatch = title.match(/Battle\s+(?:of|at)\s+(.+)/i);
    if (battleMatch) queries.push(`Battle of ${battleMatch[1]}`);
  }
  
  // 7. Description-based queries (if title search fails)
  if (description) {
    // Extract proper nouns from description
    const descNouns = description.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
    if (descNouns) {
      for (const dn of descNouns.slice(0, 2)) {
        if (dn.length > 5) queries.push(dn);
      }
    }
  }
  
  return [...new Set(queries)];
}

// ═══════════════════════════════════════════════
//  MAIN RESOLUTION PIPELINE
// ═══════════════════════════════════════════════

async function main() {
  const dates = ["April 20", "April 21", "April 22", "April 23", "April 24", "April 25", "April 26"];
  
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  HOXE IMAGE RESOLVER v2 — MULTI-STRATEGY PERSONALIZED IMAGES ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  let stats = { total: 0, wikiSummary: 0, wikiSearch: 0, commons: 0, failed: 0 };
  const failedCards: any[] = [];

  for (const date of dates) {
    const { data } = await supabase
      .from("daily_briefings")
      .select("*, briefing_items (*)")
      .eq("date", date)
      .limit(1)
      .single();

    if (!data) {
      console.log(`❌ ${date} — NOT FOUND`);
      continue;
    }

    const items = data.briefing_items || [];
    console.log(`\n══ ${date} (${items.length} cards) ══`);

    for (const item of items) {
      stats.total++;
      const queries = generateSearchQueries(item.title, item.category, item.short_explanation);
      
      process.stdout.write(`  [${item.category.substring(0, 16).padEnd(16)}] ${item.title.substring(0, 42).padEnd(42)} `);

      let foundUrl: string | null = null;
      let source = "";

      // STRATEGY 1: Wikipedia REST Summary (fastest, most reliable for named articles)
      for (const q of queries) {
        foundUrl = await wikiSummaryImage(q);
        if (foundUrl) {
          source = "Wikipedia";
          stats.wikiSummary++;
          break;
        }
        await new Promise(r => setTimeout(r, 200));
      }

      // STRATEGY 2: Wikipedia Search API (finds articles by search, gets their images)
      if (!foundUrl) {
        for (const q of queries.slice(0, 3)) {
          foundUrl = await wikiSearchImage(q);
          if (foundUrl) {
            source = "Wikipedia Search";
            stats.wikiSearch++;
            break;
          }
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // STRATEGY 3: Wikimedia Commons (broadest image library — paintings, photos, maps, etc.)
      if (!foundUrl) {
        for (const q of queries.slice(0, 3)) {
          foundUrl = await commonsSearchImage(q);
          if (foundUrl) {
            source = "Wikimedia Commons";
            stats.commons++;
            break;
          }
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (foundUrl) {
        // Update Supabase
        await supabase
          .from("briefing_items")
          .update({ image_url: foundUrl, image_source: source })
          .eq("id", item.id);
        
        process.stdout.write(`✅ [${source}]\n`);
      } else {
        stats.failed++;
        failedCards.push({ id: item.id, date, title: item.title, category: item.category, queries });
        process.stdout.write(`❌ NO IMAGE\n`);
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Save failed cards for manual resolution
  fs.writeFileSync("tmp_failed_images.json", JSON.stringify(failedCards, null, 2), "utf-8");

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log(`║  RESOLUTION COMPLETE                                      ║`);
  console.log(`║  Total: ${String(stats.total).padEnd(6)}                                    ║`);
  console.log(`║  Wiki Summary: ${String(stats.wikiSummary).padEnd(4)} | Wiki Search: ${String(stats.wikiSearch).padEnd(4)} | Commons: ${String(stats.commons).padEnd(4)}║`);
  console.log(`║  Failed (need manual): ${String(stats.failed).padEnd(4)}                           ║`);
  console.log("╚═══════════════════════════════════════════════════════════╝");
  
  if (failedCards.length > 0) {
    console.log(`\n⚠️  ${failedCards.length} cards need manual images — saved to tmp_failed_images.json`);
  }
}

main().catch(console.error);
