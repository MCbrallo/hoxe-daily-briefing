import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getSpotifyToken(): Promise<string> {
  const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player");
  const data = await res.json();
  return data.accessToken;
}

async function searchSpotify(token: string, query: string) {
  const res = await fetch(`https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.tracks?.items?.length > 0) {
    const track = data.tracks.items[0];
    return {
      spotifyId: track.id,
      spotifyTitle: track.name,
      spotifyArtist: track.artists[0]?.name,
      spotifyCover: track.album?.images[0]?.url
    };
  }
  return null;
}

async function main() {
  const allowedDates = ["April 20", "April 21", "April 22", "April 23", "April 24", "April 25", "April 26"];
  
  console.log("Getting Spotify anonymous token...");
  const token = await getSpotifyToken();
  if (!token) throw new Error("Failed to get token");

  console.log("Fetching music cards...");
  const { data: items } = await supabase
    .from("briefing_items")
    .select("id, title, category, metadata_spotify_track_id");
    
  if (!items) return;
  
  let converted = 0;
  
  for (const item of items) {
     if (!item.metadata_spotify_track_id) continue;
     
     // Current metadata is the Deezer object
     let meta: any = {};
     try {
       // Check if it's already a JSON object or string
       meta = typeof item.metadata_spotify_track_id === 'string' 
         ? JSON.parse(item.metadata_spotify_track_id) 
         : item.metadata_spotify_track_id;
     } catch (e) {
       console.log("JSON parse error on:", item.title);
       continue;
     }

     // If it's already Spotify, skip
     if (meta.spotifyId) {
        console.log(`[Spotify already] ${item.title}`);
        continue;
     }

     const query = meta.deezerTitle && meta.deezerArtist 
       ? `${meta.deezerArtist} ${meta.deezerTitle}` 
       : item.title;
     
     const track = await searchSpotify(token, query);
     
     if (track) {
       const newMeta = {
         spotifyId: track.spotifyId,
         spotifyTitle: track.spotifyTitle,
         spotifyArtist: track.spotifyArtist,
         spotifyCover: track.spotifyCover
       };
       
       await supabase
         .from("briefing_items")
         .update({ metadata_spotify_track_id: newMeta })
         .eq("id", item.id);
       
       console.log(`✅ [${item.title}] -> Spotify: ${track.spotifyTitle} by ${track.spotifyArtist}`);
       converted++;
     } else {
       console.log(`❌ [${item.title}] -> Spotify search failed for query: ${query}`);
     }
     
     await new Promise(r => setTimeout(r, 500)); // be nice to Spotify API
  }
  
  console.log(`\nDone. Converted ${converted} tracks to Spotify.`);
}

main().catch(console.error);
