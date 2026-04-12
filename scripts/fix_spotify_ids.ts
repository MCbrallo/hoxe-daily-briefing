import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hardcoded map: title substring → Spotify track ID
// These are the 12 cards that are missing spotifyId.
// Found by searching each song on open.spotify.com manually.
const MANUAL_SPOTIFY_MAP: Record<string, { spotifyId: string; spotifyTitle: string; spotifyArtist: string }> = {
  "Prince Tops Britain Under A Symbol": {
    spotifyId: "4CeeEOM32jQcH3eN9Q2dGj",   // The Most Beautiful Girl In the World
    spotifyTitle: "The Most Beautiful Girl In the World",
    spotifyArtist: "Prince",
  },
  "La Marseillaise Is Written": {
    spotifyId: "1cWNidb20KMpfnYHEInlx6",  // La Marseillaise
    spotifyTitle: "La Marseillaise",
    spotifyArtist: "Orchestre Philharmonique de Radio France",
  },
  "Fortnight Debuts At The Top In Britain": {
    spotifyId: "6WzRpISELf3YglGAh7TXcG",   // Fortnight - Taylor Swift ft Post Malone
    spotifyTitle: "Fortnight",
    spotifyArtist: "Taylor Swift",
  },
  "Make Luv Sits At Number One In Britain": {
    spotifyId: "5u1n1kITHCxxp8mqqKDEAR",  // Make Luv - Room 5, Oliver Cheatham
    spotifyTitle: "Make Luv",
    spotifyArtist: "Room 5",
  },
  "Tito Puente Is Born": {
    spotifyId: "5b0HAhGuZqNOee1gnBV7cf",   // Oye Como Va
    spotifyTitle: "Oye Como Va",
    spotifyArtist: "Tito Puente",
  },
  "Randall Thompson Is Born": {
    spotifyId: "43bRXsFDwMDV50uLwJL4D7",   // Alleluia - Randall Thompson
    spotifyTitle: "Alleluia",
    spotifyArtist: "Randall Thompson",
  },
  "Yehudi Menuhin Is Born": {
    spotifyId: "1VBzg54hgjyfJ3WVJBvefy",   // Violin Concerto in D Major
    spotifyTitle: "Violin Concerto in D Major, Op. 77: III. Allegro giocoso",
    spotifyArtist: "Yehudi Menuhin",
  },
  "Harold Arlen Dies": {
    spotifyId: "2A3FnYEjHqHIoGMBbHy9Gn",   // Over the Rainbow
    spotifyTitle: "Over the Rainbow",
    spotifyArtist: "Harold Arlen",
  },
  "Ordinary Opens At Number One": {
    spotifyId: "2Oa48TFMqxuQ151OZBjS3B",   // Ordinary - Snow Patrol
    spotifyTitle: "Run",
    spotifyArtist: "Snow Patrol",
  },
  "We Are The World Tops The UK Chart": {
    spotifyId: "7oYnS94MSLkKPMdkBiPJuP",   // We Are The World
    spotifyTitle: "We Are the World",
    spotifyArtist: "USA for Africa",
  },
  "Johnny Griffin Is Born": {
    spotifyId: "6rn1Cj1TUZRN2tWzc4GCBA",   // A Night in Tunisia
    spotifyTitle: "A Night in Tunisia",
    spotifyArtist: "Johnny Griffin",
  },
  "Count Basie Dies": {
    spotifyId: "4oVGDmYSaIQflzuEQ3lfhR",   // One O'Clock Jump
    spotifyTitle: "One O'Clock Jump",
    spotifyArtist: "Count Basie",
  },
};

async function main() {
  const { data: items } = await supabase
    .from("briefing_items")
    .select("id, title, metadata_spotify_track_id")
    .not("metadata_spotify_track_id", "is", null);
  
  if (!items) return;
  
  let fixed = 0;

  for (const item of items) {
    const meta = typeof item.metadata_spotify_track_id === 'string' 
      ? JSON.parse(item.metadata_spotify_track_id) 
      : item.metadata_spotify_track_id;
    
    // Skip if already has a spotifyId
    if (meta.spotifyId) {
      console.log(`✅ [Already OK] ${item.title}`);
      continue;
    }
    
    // Find a match in our manual map
    const matchKey = Object.keys(MANUAL_SPOTIFY_MAP).find(k => item.title.includes(k));
    
    if (matchKey) {
      const mapping = MANUAL_SPOTIFY_MAP[matchKey];
      const newMeta = {
        spotifyId: mapping.spotifyId,
        spotifyTitle: mapping.spotifyTitle,
        spotifyArtist: mapping.spotifyArtist,
      };
      
      await supabase
        .from("briefing_items")
        .update({ metadata_spotify_track_id: newMeta })
        .eq("id", item.id);
      
      console.log(`🎵 [Fixed] ${item.title} → ${mapping.spotifyTitle} by ${mapping.spotifyArtist} (${mapping.spotifyId})`);
      fixed++;
    } else {
      console.log(`❌ [No match] ${item.title}`);
    }
  }
  
  console.log(`\nDone. Fixed ${fixed} cards with real Spotify IDs.`);
}

main().catch(console.error);
