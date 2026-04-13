import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ytSearch from "yt-search";

dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function checkEmbed(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/embed/${videoId}`);
    const text = await res.text();
    return !(/video unavailable|unplayable/i.test(text));
  } catch (e) {
    return false; // Safely assume unplayable on network error
  }
}

async function run() {
  const { data: cards } = await s.from("briefing_items").select("id, title, metadata_spotify_track_id").in("category", ["music", "viral_music"]);
  if (!cards) return;

  for (const card of cards) {
    if (!card.metadata_spotify_track_id) continue;
    
    let payload;
    try {
      payload = JSON.parse(card.metadata_spotify_track_id);
    } catch { continue; } // Deezer/Spotify fallback or raw IDs

    if (!payload.spotifyId || payload.spotifyId.length !== 11) continue;

    const isOk = await checkEmbed(payload.spotifyId);
    if (!isOk) {
      console.log(`[BLOCKED] ${card.title} (ID: ${payload.spotifyId}). Finding replacement...`);
      const searchRes = await ytSearch(`${card.title} song`);
      let newId = null;
      let newCover = null;
      let newArtist = null;

      for (const v of searchRes.videos) {
        if (await checkEmbed(v.videoId)) {
          newId = v.videoId;
          newCover = v.thumbnail;
          newArtist = v.author.name;
          break; // First playable video found!
        }
      }

      if (newId) {
        payload.spotifyId = newId;
        payload.spotifyCover = newCover;
        payload.spotifyArtist = newArtist;
        
        await s.from("briefing_items").update({
          metadata_spotify_track_id: JSON.stringify(payload)
        }).eq("id", card.id);
        
        console.log(`✅ Fixed! New video: ${newId} (${newArtist})`);
      } else {
        console.log(`❌ Could not find ANY playable replacements for ${card.title}!`);
      }
    }
  }
  console.log("Audit complete.");
}
run();
