import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import puppeteer from "puppeteer";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function extractMusicQuery(title: string): string {
  let q = title;
  const birthMatch = q.match(/^Birth Of (.+)$/i);
  if (birthMatch) return birthMatch[1].trim();
  const billboardMatch = q.match(/^(.+?)\s+(?:Leads|Reaches|Tops)\s+The\s+Billboard.*?(?:With|Summit With)\s+(.+)$/i);
  if (billboardMatch) return `${billboardMatch[1].replace(/\s+Ft\.?\s+.*/i, '').trim()} ${billboardMatch[2].trim()}`;
  const releaseMatch = q.match(/^(.+?)\s+(?:Releases?|Records?)\s+(?:Her|His|Their|The)?\s*(?:Single|Album|Song)?\s*["\"]?(.+?)["\"]?\s*$/i);
  if (releaseMatch) return `${releaseMatch[1].trim()} ${releaseMatch[2].replace(/[""]/g, '').trim()}`;
  const classicalMatch = q.match(/^(.+?)['']s?\s+(?:Opera|Symphony|Oratorio|Passion)\s+["""]?(.+?)["""]?\s+(?:Premieres|Opens|Debuts)/i);
  if (classicalMatch) return `${classicalMatch[1].trim()} ${classicalMatch[2].trim()}`;
  const quoted = q.match(/["""](.+?)["""]/);
  if (quoted) {
    const beforeQuote = q.substring(0, q.indexOf(quoted[0])).trim();
    const names = beforeQuote.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (names) return `${names[0]} ${quoted[1]}`;
    return quoted[1];
  }
  q = q.replace(/\s*\(\d+\)\s*/g, ' ');
  q = q.replace(/\b(Ft\.?|Featuring)\b/gi, '');
  return q.trim();
}

async function run() {
  console.log("=== REMOVING DUMMY FAILSAFE CARDS ===");
  const { error: delErr } = await s.from("briefing_items").delete().eq("short_explanation", "A definitive moment in global musical history.");
  if (delErr) {
    console.error("Failed to clean dummy cards:", delErr);
  } else {
    console.log("Cleaned up dummy failsafe cards.");
  }

  console.log("=== FETCHING GENUINE DB CARDS ===");
  const { data: cards } = await s.from("briefing_items").select("id, title, category, metadata_spotify_track_id").in("category", ["music", "viral_music"]);
  
  if (!cards) return;

  const cardsToFix = cards.filter(c => !c.metadata_spotify_track_id || c.metadata_spotify_track_id.length < 5);
  console.log(`Found ${cardsToFix.length} genuine music cards needing Spotify resolution.`);

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  // Spoof user agent to ensure mobile/basic HTML fallback if possible, or just normal desktop
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

  let resolved = 0;
  let failed = 0;

  for (const card of cardsToFix) {
    const q = extractMusicQuery(card.title);
    process.stdout.write(`Resolving "${q}"... `);

    try {
      const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(q)}/tracks`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      
      // Look for the first track link: href starts with /track/
      const trackId = await page.evaluate(() => {
        // Wait briefly for react to mount track links
        return new Promise((resolve) => {
          setTimeout(() => {
            const links = Array.from(document.querySelectorAll('a[href^="/track/"]'));
            for (const link of links) {
              const href = link.getAttribute("href");
              if (href && href.length > 15) {
                const id = href.split("/track/")[1].split("?")[0];
                if (id) {
                  return resolve(id);
                }
              }
            }
            resolve(null);
          }, 3000); // 3 seconds grace for SPAs
        });
      });

      if (trackId) {
        // We have the ID, write it (we can put generic title/artist, iframe only needs ID)
        const payload = JSON.stringify({
          spotifyId: trackId,
          spotifyTitle: q,
          spotifyArtist: "Spotify Track",
          spotifyCover: ""
        });

        await s.from("briefing_items").update({ metadata_spotify_track_id: payload }).eq("id", card.id);
        console.log(`✅ [${trackId}]`);
        resolved++;
      } else {
        console.log(`❌ Not found in DOM`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ Timeout or error`);
      failed++;
    }
  }

  await browser.close();
  console.log(`\nDONE. Resolved ${resolved}, Failed ${failed}`);
}
run();
