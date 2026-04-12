/**
 * HOXE IMAGE RESOLVER — SECOND PASS
 * 
 * Fixes the remaining 41 cards that didn't resolve in the first pass.
 * Uses manually crafted, smarter Wikipedia/Commons queries.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Better search queries crafted per card
const MANUAL_QUERIES: Record<string, string[]> = {
  "A Runner Posts The Fastest Marathon Dressed As A Leprechaun": ["marathon runner costume", "London Marathon"],
  "Guadalajara Is Torn Apart By Sewer Explosions": ["1992 Guadalajara explosions", "Guadalajara disaster"],
  "A Collector Amasses A Record LEGO Minifigure Army": ["LEGO minifigure", "LEGO collection"],
  "Portugal'S Carnation Revolution Begins": ["Carnation Revolution", "Revolução dos Cravos", "25 April 1974 Portugal"],
  "Felix Klein Is Born": ["Felix Klein mathematician", "Klein bottle"],
  "Marc Isambard Brunel Is Born": ["Marc Isambard Brunel", "Brunel engineer", "Thames Tunnel"],
  "The DNA Double Helix Enters Print": ["DNA double helix", "Watson and Crick", "DNA structure"],
  "Anders Celsius Dies": ["Anders Celsius", "Celsius temperature", "thermometer"],
  "Gallipoli Landings Begin": ["Gallipoli campaign", "Gallipoli 1915", "ANZAC Gallipoli"],
  "Marks' Mills Becomes A Confederate Victory": ["Battle of Marks' Mills", "American Civil War battle", "Civil War Arkansas"],
  "La Marseillaise Is Written": ["La Marseillaise", "Rouget de Lisle", "French national anthem"],
  "Bell Labs Unveils The First Practical Solar Cell": ["Bell Labs solar cell", "first solar cell 1954", "solar photovoltaic"],
  "Pioneer 10 Moves Beyond Pluto'S Orbit": ["Pioneer 10", "Pioneer spacecraft", "deep space probe"],
  "Violeta Chamorro Takes Office In Nicaragua": ["Violeta Chamorro", "Nicaragua president"],
  "ANZAC Day Is First Commemorated": ["ANZAC Day", "Gallipoli commemoration", "ANZAC memorial"],
  "USS Triton Completes A Submerged Circumnavigation": ["USS Triton (SSRN-586)", "USS Triton submarine"],
  "Erie Overturns A Major Legal Assumption": ["Erie Railroad Co. v. Tompkins", "Supreme Court 1938"],
  "Robert Noyce Receives An Integrated Circuit Patent": ["Robert Noyce", "integrated circuit", "Fairchild Semiconductor"],
  "Nepal Is Struck By A Devastating Quake": ["2015 Nepal earthquake", "Nepal earthquake Kathmandu"],
  "Leon Battista Alberti Dies": ["Leon Battista Alberti", "Alberti architecture", "Renaissance architect"],
  "The Thornton Affair Helps Ignite The Mexican American War": ["Thornton Affair", "Mexican–American War", "Battle of Palo Alto"],
  "A Comedian Performs The Longest Solo Stand Up Show": ["stand-up comedy marathon", "comedy world record"],
  "A Six Person Relay Team Circles Bahrain At Record Pace": ["relay running Bahrain", "ultramarathon relay"],
  "Ordinary Opens At Number One": ["Alex Warren singer", "Alex Warren music"],
  "Petrarch Climbs Mont Ventoux": ["Petrarch", "Mont Ventoux", "Francesco Petrarca"],
  "English Colonists Land At Cape Henry": ["Cape Henry Virginia", "Jamestown settlement", "Virginia Company 1607"],
  "Tanganyika And Zanzibar Become Tanzania": ["Tanzania independence", "Julius Nyerere", "union Tanganyika Zanzibar"],
  "The Geneva Conference Opens": ["Geneva Conference 1954", "Geneva Accords", "Indochina conference"],
  "Arno Penzias Is Born": ["Arno Allan Penzias", "cosmic microwave background", "Penzias Wilson"],
  "Michael Smith Is Born": ["Michael Smith biochemist", "Nobel Prize chemistry", "site-directed mutagenesis"],
  "Arnold Sommerfeld Dies": ["Arnold Sommerfeld", "Sommerfeld physicist"],
  "Marines Seize Derna": ["Battle of Derna 1805", "First Barbary War", "shores of Tripoli"],
  "Guernica Is Bombed": ["Guernica bombing", "bombing of Guernica", "Picasso Guernica", "Guernica 1937"],
  "Count Basie Dies": ["Count Basie", "William James Basie", "Count Basie Orchestra"],
  "The Container Age Leaves Port": ["Ideal X container ship", "containerization", "Malcolm McLean shipping"],
  "Chernobyl Explodes": ["Chernobyl disaster", "Chernobyl nuclear", "Chernobyl 1986"],
  "Ice Hockey Makes Its Olympic Debut": ["ice hockey Olympics", "1920 Summer Olympics", "Olympic hockey history"],
  "Tashkent Is Devastated By An Earthquake": ["1966 Tashkent earthquake", "Tashkent city"],
  "The Gestapo Is Created": ["Gestapo", "Secret State Police", "Nazi Germany police"],
  "World Intellectual Property Day Is Launched": ["WIPO", "World Intellectual Property Organization", "intellectual property"],
  "Bill Cosby Is Found Guilty At Retrial": ["Bill Cosby trial", "Bill Cosby"],
  "A Speed Eater Downs Anchovies At Record Pace": ["competitive eating", "eating contest"],
  "Two People Assemble Tacos At Record Speed": ["taco making", "speed cooking"],
  "Fortnight Debuts At The Top In Britain": ["Taylor Swift Fortnight", "Tortured Poets Department", "Taylor Swift 2024"],
  "Frederick Law Olmsted Is Born": ["Frederick Law Olmsted", "Central Park design", "Olmsted landscape"],
};

async function wikiSummaryImage(query: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'HoxeImageResolver/2.1' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail?.source) return data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
      if (data.originalimage?.source) return data.originalimage.source;
    }
  } catch {}
  return null;
}

async function wikiSearchImage(query: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HoxeImageResolver/2.1' }, signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const p of Object.values(pages) as any[]) {
          if (p.thumbnail?.source) return p.thumbnail.source;
        }
      }
    }
  } catch {}
  return null;
}

async function commonsSearchImage(query: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HoxeImageResolver/2.1' }, signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const p of Object.values(pages) as any[]) {
          const info = p.imageinfo?.[0];
          if (info) return info.thumburl || info.url;
        }
      }
    }
  } catch {}
  return null;
}

async function main() {
  const failedCards: any[] = JSON.parse(fs.readFileSync("tmp_failed_images.json", "utf-8"));
  
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  HOXE IMAGE RESOLVER — SECOND PASS (Manual Query Tuning)    ║");
  console.log(`║  Processing ${failedCards.length} remaining cards                                ║`);
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  let fixed = 0;
  let stillFailed: any[] = [];

  for (const card of failedCards) {
    const queries = MANUAL_QUERIES[card.title] || [card.title];
    
    process.stdout.write(`  ${card.title.substring(0, 55).padEnd(55)} `);

    let foundUrl: string | null = null;
    let source = "";

    // Try all strategies with manual queries
    for (const q of queries) {
      // Strategy 1: Wiki Summary
      foundUrl = await wikiSummaryImage(q);
      if (foundUrl) { source = "Wikipedia"; break; }
      
      // Strategy 2: Wiki Search
      foundUrl = await wikiSearchImage(q);
      if (foundUrl) { source = "Wikipedia Search"; break; }
      
      // Strategy 3: Commons
      foundUrl = await commonsSearchImage(q);
      if (foundUrl) { source = "Wikimedia Commons"; break; }
      
      await new Promise(r => setTimeout(r, 300));
    }

    if (foundUrl) {
      await supabase
        .from("briefing_items")
        .update({ image_url: foundUrl, image_source: source })
        .eq("id", card.id);
      fixed++;
      console.log(`✅ [${source}]`);
    } else {
      stillFailed.push(card);
      console.log(`❌ STILL MISSING`);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  fs.writeFileSync("tmp_still_failed.json", JSON.stringify(stillFailed, null, 2), "utf-8");
  
  console.log(`\n═══ SECOND PASS RESULTS ═══`);
  console.log(`Fixed: ${fixed}/${failedCards.length}`);
  console.log(`Still missing: ${stillFailed.length}`);
  if (stillFailed.length > 0) {
    console.log(`\nStill missing cards:`);
    for (const c of stillFailed) {
      console.log(`  - ${c.title}`);
    }
  }
}

main().catch(console.error);
