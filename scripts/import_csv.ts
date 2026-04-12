import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { parse } from "csv-parse";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface CsvRow {
  date: string;
  category: string;
  title: string;
  year: string;
  short_explanation: string;
  why_it_matters: string;
  youtube_id: string;
}

// ═══════════════════════════════════════════════
//  THE IMAGE HUNTER
// ═══════════════════════════════════════════════

function isValidImageFormat(url: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp');
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

async function searchWikipediaImage(query: string): Promise<string | null> {
  try {
    // 1. First, search for exactly the article matching the title
    const searchRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'HoxeBot/2.0' }
    });
    
    if (searchRes.ok) {
      const summary = await searchRes.json();
      
      if (summary.thumbnail?.source) {
        const thumbUrl = summary.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        if (isValidImageFormat(thumbUrl) && await validateImage(thumbUrl)) return thumbUrl;
        if (isValidImageFormat(summary.thumbnail.source) && await validateImage(summary.thumbnail.source)) return summary.thumbnail.source;
      }
      if (summary.originalimage?.source && isValidImageFormat(summary.originalimage.source)) {
        if (await validateImage(summary.originalimage.source)) return summary.originalimage.source;
      }
    }
    
    // 2. If no exact match summary, fallback to duckduckgo image search logic or Wikipedia Search API
    const searchApi = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&utf8=1`);
    if (searchApi.ok) {
        const sr = await searchApi.json();
        if (sr.query?.search?.length > 0) {
            const firstHitTitle = sr.query.search[0].title;
            const hitRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstHitTitle)}`);
            if (hitRes.ok) {
                const hitSum = await hitRes.json();
                if (hitSum.thumbnail?.source) {
                    const hitUrl = hitSum.thumbnail.source.replace(/\/\d+px-/, '/800px-');
                    if (isValidImageFormat(hitUrl) && await validateImage(hitUrl)) return hitUrl;
                }
            }
        }
    }

  } catch (error: any) {
    console.error(`     [!] Hunt failed for "${query}": ${error.message}`);
  }
  return null;
}

// ═══════════════════════════════════════════════
//  IMPORT LOGIC
// ═══════════════════════════════════════════════

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log("⚠️ Uso manual: npx tsx scripts/import_csv.ts <ruta_al_archivo.csv>");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ El archivo ${filePath} no existe.`);
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  HOXE v8 — CSV MANUAL PIPELINE + IMAGE HUNTER   ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }));

  const groupedByDate: Record<string, CsvRow[]> = {};

  for await (const r of parser) {
      const row = r as CsvRow;
      // Normalizing date format
      try {
          const dateObj = new Date(row.date + " 2000"); // Append dummy year to parse month/day correctly
          if (isNaN(dateObj.getTime())) throw new Error();
          const cleanDateStr = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });
          
          if (!groupedByDate[cleanDateStr]) groupedByDate[cleanDateStr] = [];
          groupedByDate[cleanDateStr].push(row);
      } catch {
          console.log(`⚠️ Fecha no válida: "${row.date}". Ignorando fila: ${row.title}`);
      }
  }

  for (const [dateString, cards] of Object.entries(groupedByDate)) {
      console.log(`\n══ PROCESANDO FECHA: ${dateString} ══`);
      
      const dateObj = new Date(`${dateString} 2000`);
      const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });

      // Upsert Briefing Header
      let briefingId = null;
      const { data: existing } = await supabase.from("daily_briefings").select("id").eq("date", dateString).limit(1).single();
      
      if (existing) {
          console.log(`   [!] Ya existe plataforma para ${dateString}. Borrando tarjetas viejas para aplicar nuevas...`);
          await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
          briefingId = existing.id;
      } else {
        const { data: root, error: rootErr } = await supabase
          .from("daily_briefings")
          .insert([{ date: dateString, day_of_week: dayOfWeek }])
          .select().single();
        if (rootErr) {
            console.error(`   ❌ Fallo creando el día ${dateString}:`, rootErr);
            continue;
        }
        briefingId = root.id;
      }

      const allItems: any[] = [];
      let imgMissingCount = 0;

      // Iterando y cazando imágenes
      for (const card of cards) {
          console.log(`   → Importando: [${card.category}] ${card.title.substring(0, 30)}...`);
          
          let imgUrl = null;
          
          // Image Hunter logic explicitly triggered for every card!
          process.stdout.write(`     🔍 Cazando imagen para "${card.title}"... `);
          imgUrl = await searchWikipediaImage(card.title);
          
          if (!imgUrl && card.category !== "viral_quote") {
              // Try searching using an alternate parameter if title is too complex
              process.stdout.write(`Fallo. Reintentando con recorte... `);
              const simplerTitle = card.title.split(":")[0]; // cut at colons
              imgUrl = await searchWikipediaImage(simplerTitle);
          }

          if (imgUrl) {
              console.log(`¡Éxito!`);
          } else {
              console.log(`Sin imagen.`);
              if (!card.category.startsWith('viral_')) imgMissingCount++;
          }

          allItems.push({
              briefing_id: briefingId,
              category: card.category,
              title: card.title,
              year: card.year || "Unknown",
              short_explanation: card.short_explanation,
              why_it_matters: card.why_it_matters,
              image_url: imgUrl,
              image_source: imgUrl ? "Auto-Hunt: Wikipedia" : null,
              metadata_spotify_track_id: card.youtube_id || null // Reusing DB column for Youtube IDs as planned
          });
      }

      if (allItems.length > 0) {
        const { error } = await supabase.from("briefing_items").insert(allItems);
        if (error) {
            console.error(`   ❌ Error subiendo tarjetas:`, error);
        } else {
            console.log(`   ✓ Subidas ${allItems.length} tarjetas para ${dateString}. (${imgMissingCount} editoriales terminaron sin foco de imagen).`);
        }
      }
  }

  console.log("\n✅ IMPORTACIÓN FINALIZADA Y PROTEGIDA EN LA BASE DE DATOS.");
}

if (typeof process !== 'undefined' && process.argv[1]) {
  main();
}
