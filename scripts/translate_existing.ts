import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY!;
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || "global";
const AZURE_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

if (!AZURE_KEY) { console.error("Missing AZURE_TRANSLATOR_KEY"); process.exit(1); }

// ── Azure Translator: batch translate multiple texts to ES+GL in ONE call ──
async function batchTranslate(texts: string[]): Promise<{ es: string; gl: string }[]> {
  const body = texts.map(t => ({ Text: (t || "").substring(0, 10000) }));
  
  const res = await fetch(`${AZURE_ENDPOINT}/translate?api-version=3.0&from=en&to=es&to=gl`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
      "Ocp-Apim-Subscription-Region": AZURE_REGION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Azure API ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.map((item: any) => ({
    es: item.translations?.find((t: any) => t.to === "es")?.text || "",
    gl: item.translations?.find((t: any) => t.to === "gl")?.text || "",
  }));
}

// ── Main ──
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  HOXE Azure Translator — Fast ES + GL           ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Test the API key first
  console.log("Testing Azure API key...");
  try {
    const test = await batchTranslate(["Hello world"]);
    console.log(`  ✓ API works! "Hello world" → ES: "${test[0].es}" | GL: "${test[0].gl}"\n`);
  } catch (err: any) {
    console.error(`  ✗ API key failed: ${err.message}`);
    process.exit(1);
  }

  // Fetch all items needing translation
  const { data: items, error } = await supabase
    .from("briefing_items")
    .select("id, title, short_explanation, why_it_matters, title_es")
    .order("id", { ascending: true });

  if (error) {
    console.error("DB fetch failed:", error.message);
    process.exit(1);
  }

  const needsTranslation = (items || []).filter((it: any) => !it.title_es);
  console.log(`Found ${items?.length || 0} total items, ${needsTranslation.length} need translation.\n`);

  if (needsTranslation.length === 0) {
    console.log("✓ All items already translated!");
    return;
  }

  // Process in batches of 4 (roughly 6000-8000 chars)
  // Azure Free tier has a limit of ~33000 chars per minute.
  // We'll sleep 4 seconds between batches to stay under this limit.
  const BATCH_SIZE = 4;
  let done = 0;
  let failed = 0;

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const pct = ((done / needsTranslation.length) * 100).toFixed(0);
    console.log(`[${pct}%] Translating items ${done + 1}-${done + batch.length} of ${needsTranslation.length}...`);

    try {
      // Build flat array: [title1, short1, why1, title2, short2, why2, ...]
      const texts = batch.flatMap(item => [
        item.title || "",
        item.short_explanation || "",
        item.why_it_matters || "",
      ]);

      const results = await batchTranslate(texts);

      // Update each item in DB
      for (let j = 0; j < batch.length; j++) {
        const titleIdx = j * 3;
        const shortIdx = j * 3 + 1;
        const whyIdx = j * 3 + 2;

        const { error: updateErr } = await supabase
          .from("briefing_items")
          .update({
            title_es: results[titleIdx].es,
            title_gl: results[titleIdx].gl,
            short_explanation_es: results[shortIdx].es,
            short_explanation_gl: results[shortIdx].gl,
            why_it_matters_es: results[whyIdx].es,
            why_it_matters_gl: results[whyIdx].gl,
          })
          .eq("id", batch[j].id);

        if (updateErr) {
          console.error(`  ✗ DB update failed for "${batch[j].title?.substring(0, 30)}": ${updateErr.message}`);
          failed++;
        }
      }

      console.log(`  ✓ ${batch.map(b => `"${b.title?.substring(0, 25)}..."`).join(", ")}`);
      
      // Delay to respect 33k chars/min limit (sliding window)
      await new Promise(r => setTimeout(r, 4500));
    } catch (err: any) {
      console.error(`  ✗ Batch failed: ${err.message}`);
      failed += batch.length;
      await new Promise(r => setTimeout(r, 10000)); // longer backoff on fail
    }

    done += batch.length;
  }

  console.log(`\n══ DONE ══`);
  console.log(`  ✓ Translated: ${done - failed}/${needsTranslation.length}`);
  if (failed > 0) console.log(`  ✗ Failed: ${failed}`);
}

main().catch(console.error);
