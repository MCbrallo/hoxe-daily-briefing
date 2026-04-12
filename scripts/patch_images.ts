import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function isValidFormat(url: string): boolean {
  if (!url) return false;
  const c = url.split('?')[0].toLowerCase();
  return c.endsWith('.jpg') || c.endsWith('.jpeg') || c.endsWith('.png') || c.endsWith('.webp');
}

async function validate(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': 'HoxeBot/5.0' } });
    clearTimeout(t);
    if (!r.ok) return false;
    return (r.headers.get('content-type') || '').startsWith('image/');
  } catch { return false; }
}

async function wikiImage(query: string): Promise<string | null> {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'HoxeBot/5.0' }
    });
    if (r.ok) {
      const d = await r.json();
      if (d.thumbnail?.source) {
        const hi = d.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        if (isValidFormat(hi) && await validate(hi)) return hi;
        if (isValidFormat(d.thumbnail.source) && await validate(d.thumbnail.source)) return d.thumbnail.source;
      }
      if (d.originalimage?.source && isValidFormat(d.originalimage.source) && await validate(d.originalimage.source)) return d.originalimage.source;
    }
  } catch {}
  return null;
}

async function wikiSearch(query: string, limit = 5): Promise<string | null> {
  try {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&utf8=&format=json`);
    if (r.ok) {
      const d = await r.json();
      for (const hit of (d.query?.search || [])) {
        const img = await wikiImage(hit.title);
        if (img) return img;
      }
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════════════
// SMART NAME EXTRACTION
// ═══════════════════════════════════════════════════

function extractSearchTerms(title: string): string[] {
  const terms: string[] = [];
  
  // Original title
  terms.push(title);
  
  // Before comma/colon
  const simple = title.split(/[,:;]/)[0].trim();
  if (simple !== title && simple.length > 3) terms.push(simple);

  // "Birth Of X" pattern → search just X
  const birthMatch = title.match(/^Birth Of (.+)$/i);
  if (birthMatch) {
    terms.push(birthMatch[1].trim());
  }
  
  // "X Marries Y" → search X, then Y
  const marriageMatch = title.match(/^(.+?)\s+(?:Marries|Weds|Divorces|Files For Divorce)\s+(.+)$/i);
  if (marriageMatch) {
    terms.push(marriageMatch[1].trim().replace(/\s*\(\d+\)\s*/g, '')); // Remove age markers like (40)
    terms.push(marriageMatch[2].trim().replace(/\s*\(\d+\)\s*/g, ''));
  }

  // Extract names: remove age markers and common prefixes
  const cleaned = title
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/^(Actor|Actress|Singer|Writer|Poet|Comedian|Novelist|Designer|Model|Author|Lawyer|Explorer|President|Prime Minister|Senator|DJ|Rapper|Musician|Televangelist|Coach|Pitcher|Boxer|Cyclist|Player)\s+/i, '')
    .trim();
  if (cleaned !== title) terms.push(cleaned);
  
  // Capitalized proper nouns (2+ consecutive capitalized words)
  const properNouns = title.replace(/\s*\(\d+\)\s*/g, ' ').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  if (properNouns) {
    for (const pn of properNouns.slice(0, 3)) {
      if (pn.length > 4 && !['Birth Of', 'The First', 'The Last', 'New York', 'World War', 'United States'].includes(pn)) {
        terms.push(pn);
      }
    }
  }

  // Category-based generics as last resort will be handled at a higher level
  return [...new Set(terms)]; // Deduplicate
}

// ═══════════════════════════════════════════════════
// MAIN PATCHER
// ═══════════════════════════════════════════════════

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  HOXE IMAGE PATCHER v5 — SMART NAME EXTRACTION      ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  let missing: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await s.from("briefing_items")
      .select("id, title, category")
      .is("image_url", null)
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    missing = missing.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`[INFO] ${missing.length} cards still need images.\n`);

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const card = missing[i];
    const terms = extractSearchTerms(card.title);
    
    process.stdout.write(`  [${i + 1}/${missing.length}] ${card.title.substring(0, 50).padEnd(50)} `);

    let imgUrl: string | null = null;

    for (const term of terms) {
      imgUrl = await wikiImage(term);
      if (imgUrl) break;
      imgUrl = await wikiSearch(term, 3);
      if (imgUrl) break;
    }

    if (imgUrl) {
      await s.from("briefing_items").update({ image_url: imgUrl, image_source: "Auto-Hunt: Wikipedia" }).eq("id", card.id);
      fixed++;
      console.log("✅");
    } else {
      failed++;
      console.log("❌");
    }

    if (i > 0 && i % 25 === 0) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  PATCHED: ${fixed} | STILL MISSING: ${failed}`);
  console.log(`═══════════════════════════════════════`);
}

main();
