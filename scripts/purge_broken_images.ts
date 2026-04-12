import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function isImageWorking(originalUrl: string): Promise<boolean> {
  // If it's a wikipedia/wikimedia image, test the proxy url because that's what we serve 
  const isWiki = originalUrl.includes('wiki');
  const testUrl = isWiki 
    ? `https://wsrv.nl/?url=${originalUrl.replace('https://', '')}&w=800` 
    : originalUrl;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    // HEAD request to save bandwidth
    const res = await fetch(testUrl, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(t);
    
    return res.ok || res.status === 200 || res.status === 304 || res.status === 301 || res.status === 302;
  } catch (e) {
    return false; // timeout or network error (like blocked origin)
  }
}

async function main() {
  console.log("Fetching all cards with images...");
  const { data: items } = await supabase
    .from("briefing_items")
    .select("id, title, image_url, briefing_id")
    .neq("image_url", null);

  if (!items) return;
  console.log(`Checking ${items.length} current images...\n`);

  let brokenCount = 0;

  for (const item of items) {
    process.stdout.write(`Testing [${item.title.substring(0,25).padEnd(25)}] -> `);
    
    const working = await isImageWorking(item.image_url);
    
    if (!working) {
      console.log("❌ BROKEN (Removing from DB)");
      await supabase
        .from("briefing_items")
        .update({ image_url: null, image_source: null })
        .eq("id", item.id);
      brokenCount++;
    } else {
      console.log("✅ OK");
    }
    
    // Tiny delay to not bomb wsrv.nl too hard from one IP
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\nFinished! Removed ${brokenCount} truly broken images.`);
  
  // Re-verify the 3-per-day rule (Optional, since we are strictly REDUCING, but maybe some days have 0 now? That's fine)
}

main().catch(console.error);
