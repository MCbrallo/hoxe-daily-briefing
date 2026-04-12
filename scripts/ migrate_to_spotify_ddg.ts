import { createClient } from "@supabase/supabase-js";
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
    // Look for track IDs: open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
    const match = html.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.log("Error searching:", e);
  }
  return null;
}

async function main() {
  const { data: items } = await supabase
    .from("briefing_items")
    .select("id, title, metadata_spotify_track_id");
    
  if (!items) return;
  
  let converted = 0;
  
  for (const item of items) {
     if (!item.metadata_spotify_track_id) continue;
     
     let meta: any = {};
     try {
       meta = typeof item.metadata_spotify_track_id === 'string' 
         ? JSON.parse(item.metadata_spotify_track_id) 
         : item.metadata_spotify_track_id;
     } catch (e) { continue; }

     if (meta.spotifyId) {
        console.log(`[Already Spotify] ${item.title}`);
        continue;
     }

     const query = meta.deezerTitle && meta.deezerArtist 
       ? `${meta.deezerArtist} ${meta.deezerTitle}` 
       : item.title;
     
     const spotifyId = await extractSpotifyTrackId(query);
     
     if (spotifyId) {
       const newMeta = {
         spotifyId: spotifyId,
         // We keep the deezer title/artist/cover as fallbacks/display info
         spotifyTitle: meta.deezerTitle || item.title,
         spotifyArtist: meta.deezerArtist || '',
         spotifyCover: meta.deezerCover || ''
       };
       
       await supabase
         .from("briefing_items")
         .update({ metadata_spotify_track_id: newMeta })
         .eq("id", item.id);
       
       console.log(`✅ [${item.title}] -> Spotify ID: ${spotifyId}`);
       converted++;
     } else {
       console.log(`❌ [${item.title}] -> Spotify ID not found`);
     }
     
     await new Promise(r => setTimeout(r, 1500)); // be nice to DDG
  }
  
  console.log(`\nDone. Converted ${converted} tracks to Spotify via DDG scraping.`);
}

main().catch(console.error);
