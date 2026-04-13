import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function truncateSentences(text: string | null): string | null {
  if (!text) return null;
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text;
  
  if (sentences.length <= 2) return text;
  const keepCount = Math.floor(sentences.length * 0.45);
  return sentences.slice(0, Math.max(2, keepCount)).join(" ").trim();
}

async function main() {
  console.log("=== TRUNCATING CONTEXT TO MAX 2 SENTENCES ===");
  const { data: items, error } = await supabase.from("briefing_items").select("*");
  if (error || !items) {
    console.error("Failed to fetch items:", error);
    return;
  }

  console.log(`Found ${items.length} items. Processing...`);
  
  for (const item of items) {
    const origEn = item.why_it_matters;
    const origEs = item.why_it_matters_es;
    const origGl = item.why_it_matters_gl;

    const truncEn = truncateSentences(origEn);
    const truncEs = truncateSentences(origEs);
    const truncGl = truncateSentences(origGl);

    if (origEn !== truncEn || origEs !== truncEs || origGl !== truncGl) {
      const { error: updErr } = await supabase
        .from("briefing_items")
        .update({
          why_it_matters: truncEn,
          why_it_matters_es: truncEs,
          why_it_matters_gl: truncGl
        })
        .eq("id", item.id);
      
      if (updErr) {
        console.error(`❌ Failed to update item ${item.title}:`, updErr);
      } else {
        console.log(`✅ Truncated: ${item.title.substring(0, 30)}...`);
      }
    }
  }
  console.log("=== FINISHED TRUNCATING ===");
}

main().catch(console.error);
