import { createClient } from "@supabase/supabase-js";
import * as xlsx from "xlsx";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function extractSpotifyTrackId(query: string): Promise<string | null> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:open.spotify.com/track ' + query)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" }});
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.log("Error searching:", e);
  }
  return null;
}

async function processFile(filePath: string) {
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data: any[] = xlsx.utils.sheet_to_json(sheet);
  
  const musicRows = data.filter(d => Boolean(d.category) && String(d.category).toLowerCase().includes('music'));
  
  if (musicRows.length === 0) return;
  console.log(`Processing ${musicRows.length} music rows from ${filePath.split('/').pop()}`);

  for (const row of musicRows) {
    if (!row.song_to_add) continue;
    
    // Check if it already has spotify ID in DB
    const titleMatch = String(row.title).trim(); // simple normalization for match if needed, but iliketitle is safer
    
    const { data: dbItems } = await supabase
      .from("briefing_items")
      .select("id, title, metadata_spotify_track_id")
      .ilike("title", `%${row.title.split(/[,:;\-]/)[0].trim()}%`)
      .limit(1);
      
    if (!dbItems || dbItems.length === 0) {
      console.log(`❌ DB item not found for: ${row.title}`);
      continue;
    }
    
    const item = dbItems[0];
    
    let meta: any = {};
    if (item.metadata_spotify_track_id) {
       try { meta = typeof item.metadata_spotify_track_id === 'string' ? JSON.parse(item.metadata_spotify_track_id) : item.metadata_spotify_track_id; } catch (e) {}
    }
    
    if (meta.spotifyId) {
      console.log(`✅ [Already Spotify] ${item.title}`);
      continue;
    }
    
    const spotifyId = await extractSpotifyTrackId(row.song_to_add);
    
    if (spotifyId) {
      const parts = row.song_to_add.split('–');
      const artist = parts[0] ? parts[0].trim() : '';
      const track = parts[1] ? parts[1].trim() : row.song_to_add;

      const newMeta = {
        spotifyId: spotifyId,
        spotifyTitle: track,
        spotifyArtist: artist,
      };
      
      await supabase
        .from("briefing_items")
        .update({ metadata_spotify_track_id: newMeta })
        .eq("id", item.id);
      
      console.log(`🎵 [Fixed] ${item.title} -> ${track} by ${artist} (${spotifyId})`);
    } else {
      console.log(`⚠️ [Failed] Could not find ID on DDG for ${row.song_to_add}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  await processFile("C:/Users/34646/Downloads/on_this_day_april27_may3_master.xlsx");
  await processFile("C:/Users/34646/Downloads/on_this_day_may_4_to_10_database.xlsx");
  await processFile("C:/Users/34646/Downloads/on_this_day_may11_17_2026_app_database.xlsx");
  console.log("Done syncing Spotify tracks.");
}

main();
