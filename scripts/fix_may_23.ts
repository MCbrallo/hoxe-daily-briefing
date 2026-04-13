/**
 * HOXE — FIX May 23 (failed in batch run)
 * Same pipeline, just for the one missing day.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY!;
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || "global";

type EditorialCategory = "history" | "science" | "culture" | "warfare" | "space" | "sports" | "people" | "music";

const EDITORIAL_SCORING: Record<EditorialCategory, Record<string, number>> = {
  warfare:  { "war ": 3, "battle": 3, "military": 2, "army": 2, "invasion": 4, "siege": 3, "troops": 2, "bombing": 4, "naval": 2, "attack": 2, "revolt": 3, "revolution": 3, "coup": 4, "treaty": 2 },
  space:    { "nasa": 5, "orbit": 3, "spacecraft": 4, "planet": 3, "astronaut": 5, "rocket": 3, "satellite": 3, "lunar": 4, "mars": 4, "space ": 2, "cosmonaut": 5, "apollo": 4, "shuttle": 3, "telescope": 3 },
  science:  { "discovery": 2, "scientist": 3, "physics": 3, "quantum": 4, "chemistry": 3, "biology": 3, "experiment": 2, "theory": 2, "vaccine": 4, "dna": 4, "earthquake": 3, "eruption": 3, "volcano": 3, "patent": 2, "invented": 3 },
  sports:   { "championship": 3, "olympic": 4, "tournament": 2, "world cup": 4, "medal": 2, "athlete": 3, "football": 2, "baseball": 2, "tennis": 2, "boxing": 2, "racing": 2, "marathon": 3 },
  culture:  { "novel": 2, "film": 2, "artist": 2, "album": 2, "painting": 3, "museum": 2, "literature": 3, "theater": 2, "poetry": 3, "exhibition": 2, "playwright": 3, "director": 2, "actor": 2, "actress": 2 },
  people:   { "born": 1, "death": 1, "president": 2, "king": 2, "queen": 2, "emperor": 2, "pope": 2, "prime minister": 2, "leader": 1, "assassinated": 3, "elected": 1, "inaugurated": 2 },
  music:    { "singer": 3, "songwriter": 3, "musician": 4, "guitarist": 4, "rock band": 4, "jazz": 4, "opera": 4, "symphony": 4, "composer": 4, "concert": 3, "pianist": 4, "hip hop": 4, "rapper": 4, "band": 2, "reggae": 4, "soul": 3, "funk": 3, "disco": 4, "billboard": 3 },
  history:  {}
};

const VIRAL_KEYWORDS: Record<string, string[]> = {
  viral_music:   ["number one hit", "billboard hot", "chart-topping", "grammy", "hit single", "platinum album", "number-one", "best-selling"],
  viral_scandal: ["scandal", "impeach", "corruption", "cover-up", "leaked", "exposed", "arrested", "assassination", "murder", "trial", "convicted", "notorious"],
  viral_movie:   ["box office", "oscar", "academy award", "best picture", "blockbuster", "highest-grossing", "film festival", "golden globe"],
  viral_record:  ["world record", "guinness", "broke the record", "fastest", "longest", "largest", "first person to", "first woman to", "unprecedented", "record-breaking"],
  viral_moment:  ["broadcast live", "viral", "watched by millions", "trending", "broke the internet", "historic moment", "shocked the world"]
};

const EDITORIAL_QUOTAS: Record<EditorialCategory, [number, number]> = {
  history: [3, 5], science: [2, 4], warfare: [1, 3], culture: [1, 3],
  people: [1, 3], space: [1, 3], sports: [1, 2], music: [1, 2],
};

function categorizeScoring(text: string): EditorialCategory {
  const scores: Record<EditorialCategory, number> = { history: 0, science: 0, culture: 0, warfare: 0, space: 0, sports: 0, people: 0, music: 0 };
  const lt = text.toLowerCase();
  for (const [cat, ws] of Object.entries(EDITORIAL_SCORING) as [EditorialCategory, Record<string, number>][]) {
    for (const [w, p] of Object.entries(ws)) { if (new RegExp(`\\b${w.replace(/[#-.]/g, '\\$&')}\\b`, 'i').test(lt)) scores[cat] += p; }
  }
  let max = 0; let win: EditorialCategory = "history";
  for (const [c, s] of Object.entries(scores) as [EditorialCategory, number][]) { if (s > max) { max = s; win = c; } }
  return win;
}

function categorizeViral(text: string): string | null {
  for (const [cat, kws] of Object.entries(VIRAL_KEYWORDS)) {
    if (kws.some(kw => new RegExp(`\\b${kw.replace(/[#-.]/g, '\\$&')}\\b`, 'i').test(text))) return cat;
  }
  return null;
}

function isValid(url: string): boolean {
  if (!url) return false;
  const c = url.split('?')[0].toLowerCase();
  return c.endsWith('.jpg') || c.endsWith('.jpeg') || c.endsWith('.png') || c.endsWith('.webp');
}

async function validateImg(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': 'HoxeBot/4.0' } });
    clearTimeout(t); return r.ok && (r.headers.get('content-type') || '').startsWith('image/');
  } catch { return false; }
}

async function resolveImage(page: any): Promise<string | null> {
  if (page.thumbnail?.source) {
    const big = page.thumbnail.source.replace(/\/\d+px-/, '/800px-');
    if (isValid(big) && await validateImg(big)) return big;
    if (isValid(page.thumbnail.source) && await validateImg(page.thumbnail.source)) return page.thumbnail.source;
  }
  if (page.originalimage?.source && isValid(page.originalimage.source) && await validateImg(page.originalimage.source)) return page.originalimage.source;
  const title = page.title || page.normalizedtitle;
  if (!title) return null;
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { 'User-Agent': 'HoxeBot/4.0' } });
    if (r.ok) {
      const s = await r.json();
      if (s.thumbnail?.source) { const u = s.thumbnail.source.replace(/\/\d+px-/, '/800px-'); if (isValid(u) && await validateImg(u)) return u; if (isValid(s.thumbnail.source) && await validateImg(s.thumbnail.source)) return s.thumbnail.source; }
      if (s.originalimage?.source && isValid(s.originalimage.source) && await validateImg(s.originalimage.source)) return s.originalimage.source;
    }
  } catch {}
  return null;
}

async function resolveYoutubeId(title: string): Promise<string | null> {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:youtube.com/watch "${title}"`)}`, { headers: { "User-Agent": "HoxeBot/4.0" } });
    const h = await r.text();
    const m = h.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch { return null; }
}

const YT_FB = ["fJ9rUzIMcZQ", "YkgkThdzX-8", "gGdGFtwCNBE", "dQw4w9WgXcQ", "8UVNT4wvIGY", "kJQP7kiw5Fk"];
let fbi = 0;
function fbYt(): string { return YT_FB[fbi++ % YT_FB.length]; }

async function batchTranslate(texts: string[]): Promise<{ es: string; gl: string }[]> {
  const body = texts.map(t => ({ Text: (t || "").substring(0, 10000) }));
  const r = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es&to=gl`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY, "Ocp-Apim-Subscription-Region": AZURE_REGION, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return d.map((i: any) => ({ es: i.translations?.find((t: any) => t.to === "es")?.text || "", gl: i.translations?.find((t: any) => t.to === "gl")?.text || "" }));
}

async function main() {
  console.log("=== FIXING MAY 23 ===");

  const mm = "05", dd = "23";
  const dateString = "May 23";
  const dayOfWeek = "Saturday";

  // Clear if exists
  const { data: existing } = await supabase.from("daily_briefings").select("id").eq("date", dateString).single();
  if (existing) {
    await supabase.from("briefing_items").delete().eq("briefing_id", existing.id);
    await supabase.from("daily_briefings").delete().eq("id", existing.id);
    console.log("Cleared existing empty entry.");
  }

  // Fetch Wikipedia
  console.log("Fetching Wikipedia data...");
  const [evR, deR, biR] = await Promise.all([
    fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`, { headers: { 'User-Agent': 'HoxeBot/4.0' } }),
    fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/deaths/${mm}/${dd}`, { headers: { 'User-Agent': 'HoxeBot/4.0' } }),
    fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`, { headers: { 'User-Agent': 'HoxeBot/4.0' } })
  ]);

  if (!evR.ok) { console.error("Wikipedia events API failed:", evR.status, await evR.text()); return; }

  const evData = await evR.json();
  const deData = await deR.json();
  const biData = await biR.json();

  console.log(`Events: ${evData.events?.length || 0}, Deaths: ${deData.deaths?.length || 0}, Births: ${biData.births?.length || 0}`);

  const { data: root, error: rootErr } = await supabase.from("daily_briefings").insert([{ date: dateString, day_of_week: dayOfWeek }]).select().single();
  if (rootErr) { console.error("Failed to create briefing:", rootErr); return; }

  const allItems: any[] = [];
  const allEvents = (evData.events || []).filter((e: any) => e.pages?.length > 0 && e.pages[0].extract).sort(() => 0.5 - Math.random());

  const pools: Record<string, any[]> = {
    history: [], science: [], culture: [], warfare: [], space: [], sports: [], people: [], music: [],
    viral_music: [], viral_scandal: [], viral_movie: [], viral_record: [], viral_moment: []
  };

  for (const event of allEvents) {
    const page = event.pages[0];
    const combined = (event.text || '') + ' ' + (page.extract || '');
    const vc = categorizeViral(combined);
    if (vc) { pools[vc].push({ event, page, year: event.year }); pools[categorizeScoring(combined)].push({ event, page, year: event.year }); continue; }
    pools[categorizeScoring(combined)].push({ event, page, year: event.year });
  }

  // Editorial
  for (const [cat, limits] of Object.entries(EDITORIAL_QUOTAS) as [EditorialCategory, [number, number]][]) {
    let count = 0;
    for (const { event, page, year } of pools[cat]) {
      if (count >= limits[1]) break;
      const imgUrl = await resolveImage(page);
      if (!imgUrl) continue;
      const title = page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled';
      let ytId: string | null = null;
      if (cat === "music") { ytId = await resolveYoutubeId(title + " official audio"); if (!ytId) ytId = fbYt(); }
      allItems.push({ briefing_id: root.id, category: cat, title, year: year ? String(year) : "Unknown", short_explanation: event.text, why_it_matters: page.extract, image_url: imgUrl, image_source: "Wikimedia Commons", metadata_spotify_track_id: ytId });
      count++;
    }
  }

  // Music fallback via births
  if (allItems.filter(i => i.category === 'music').length < 1) {
    console.log("Searching births for musicians...");
    const births = (biData.births || []).filter((b: any) => b.pages?.length > 0 && b.pages[0].extract).sort(() => 0.5 - Math.random());
    for (const birth of births) {
      if (allItems.filter(i => i.category === 'music').length >= 1) break;
      const page = birth.pages[0];
      const combined = (birth.text || '') + ' ' + (page.extract || '');
      if (!categorizeScoring(combined).match(/music|culture/)) continue;
      const imgUrl = await resolveImage(page);
      if (!imgUrl) continue;
      const title = page.normalizedtitle || page.title?.replace(/_/g, ' ') || 'Untitled';
      let ytId = await resolveYoutubeId(title + " official music video"); if (!ytId) ytId = fbYt();
      allItems.push({ briefing_id: root.id, category: "music", title, year: birth.year ? String(birth.year) : "Unknown", short_explanation: birth.text || "Born on this day", why_it_matters: page.extract, image_url: imgUrl, image_source: "Wikimedia Commons", metadata_spotify_track_id: ytId });
    }
  }

  // Viral
  let vf = 0;
  const saveV = async (cat: string, cand: any) => {
    const imgUrl = await resolveImage(cand.page);
    const title = cand.page.normalizedtitle || cand.page.title?.replace(/_/g, ' ') || 'Untitled';
    let ytId: string | null = null;
    if (cat === "viral_music") { ytId = await resolveYoutubeId(title + " official"); if (!ytId) ytId = fbYt(); }
    allItems.push({ briefing_id: root.id, category: cat, title, year: cand.year ? String(cand.year) : "Unknown", short_explanation: cand.event.text, why_it_matters: cand.page.extract, image_url: imgUrl, image_source: imgUrl ? "Wikimedia Commons" : null, metadata_spotify_track_id: ytId });
    vf++; return true;
  };

  const vKeys = ["viral_scandal", "viral_movie", "viral_record", "viral_moment", "viral_music"];
  let keepGoing = true;
  while (keepGoing && vf < 5) {
    let found = false;
    for (const k of vKeys) { if (vf >= 5) break; if (pools[k].length > 0) { await saveV(k, pools[k].shift()); found = true; } }
    if (!found) keepGoing = false;
  }

  if (vf < 5) {
    const unused = [...pools.history, ...pools.science, ...pools.culture, ...pools.sports].filter(c => c.year && parseInt(c.year) > 1900).sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    for (const c of unused) { if (vf >= 5) break; const t = c.page.normalizedtitle || c.page.title?.replace(/_/g, ' ') || ''; if (allItems.some(i => i.title === t)) continue; await saveV("viral_moment", c); }
  }

  // People fallback via deaths
  if (allItems.filter(i => i.category === 'people').length < 3) {
    const deaths = (deData.deaths || []).filter((d: any) => d.pages?.length > 0 && d.pages[0].extract).sort(() => 0.5 - Math.random());
    for (const death of deaths) {
      if (allItems.filter(i => i.category === 'people').length >= 3) break;
      const page = death.pages[0];
      const imgUrl = await resolveImage(page);
      if (!imgUrl) continue;
      allItems.push({ briefing_id: root.id, category: "people", title: page.normalizedtitle || page.title?.replace(/_/g, ' '), year: death.year ? String(death.year) : "Unknown", short_explanation: death.text || "Died on this day", why_it_matters: page.extract, image_url: imgUrl, image_source: "Wikimedia Commons", metadata_spotify_track_id: null });
    }
  }

  // Translate
  if (allItems.length > 0 && AZURE_KEY) {
    console.log(`Translating ${allItems.length} items...`);
    const BS = 4; let done = 0, fail = 0;
    for (let i = 0; i < allItems.length; i += BS) {
      const batch = allItems.slice(i, i + BS);
      try {
        const texts = batch.flatMap(it => [it.title || "", it.short_explanation || "", it.why_it_matters || ""]);
        const res = await batchTranslate(texts);
        for (let j = 0; j < batch.length; j++) { const t = j * 3; batch[j].title_es = res[t].es; batch[j].title_gl = res[t].gl; batch[j].short_explanation_es = res[t+1].es; batch[j].short_explanation_gl = res[t+1].gl; batch[j].why_it_matters_es = res[t+2].es; batch[j].why_it_matters_gl = res[t+2].gl; }
        await new Promise(r => setTimeout(r, 4500));
      } catch (err: any) { console.error(`Translation batch failed: ${err.message?.substring(0, 100)}`); fail += batch.length; }
      done += batch.length;
    }
    console.log(`Translation: ${done - fail}/${allItems.length}`);
  }

  // Insert
  if (allItems.length > 0) {
    const { error } = await supabase.from("briefing_items").insert(allItems);
    if (error) { console.error("Insert error:", error); return; }
    const ed = allItems.filter(i => !i.category.startsWith('viral_')).length;
    const vi = allItems.filter(i => i.category.startsWith('viral_')).length;
    const img = allItems.filter(i => i.image_url).length;
    const mus = allItems.filter(i => i.category === 'music').length;
    console.log(`COMMITTED: ${ed} editorial + ${vi} viral (${img} imgs, ${mus} music)`);
  } else {
    console.log("WARNING: No items generated for May 23!");
  }
}

main().catch(console.error);
