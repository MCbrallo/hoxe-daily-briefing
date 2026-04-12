import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// IDs found by navigating to open.spotify.com and searching directly
const VERIFIED_IDS: Record<string, { spotifyId: string; spotifyTitle: string; spotifyArtist: string }> = {
  "MONTERO Rules The UK Singles Chart": {
    spotifyId: "67BtfxlNbhBmCDR2L2l8qd",
    spotifyTitle: "MONTERO (Call Me By Your Name)",
    spotifyArtist: "Lil Nas X",
  },
  "Crazy What Love Can Do Reaches The Top": {
    spotifyId: "2vIe3r96JEMy02YgCPWXrX",
    spotifyTitle: "Crazy What Love Can Do",
    spotifyArtist: "David Guetta, Becky Hill, Ella Henderson",
  },
  "Prince Tops Britain Under A Symbol": {
    spotifyId: "4CeeEOM32jQcH3eN9Q2dGj",
    spotifyTitle: "The Most Beautiful Girl In the World",
    spotifyArtist: "Prince",
  },
  "Tito Puente Is Born": {
    spotifyId: "73uEbChpBB29ttwVnwuNVE",
    spotifyTitle: "Oye Cómo Va",
    spotifyArtist: "Tito Puente",
  },
  "La Marseillaise Is Written": {
    spotifyId: "6mnOScXMwggPQvBL6C2RjM",
    spotifyTitle: "La Marseillaise",
    spotifyArtist: "Orchestre de la Garde Républicaine",
  },
  "Fortnight Debuts At The Top In Britain": {
    spotifyId: "2OzhQlSqBEmt7hmkYxfT6m",
    spotifyTitle: "Fortnight (feat. Post Malone)",
    spotifyArtist: "Taylor Swift",
  },
  "Make Luv Sits At Number One In Britain": {
    spotifyId: "6xXEw4y39shgIp6pacKQFH",
    spotifyTitle: "Make Luv",
    spotifyArtist: "Room 5",
  },
  "Randall Thompson Is Born": {
    spotifyId: "5GihMAaS7Aiz4X61D48tNj",
    spotifyTitle: "Alleluia",
    spotifyArtist: "Randall Thompson",
  },
  "Yehudi Menuhin Is Born": {
    spotifyId: "5PdowjldkOBGkgcC5zOAWU",
    spotifyTitle: "Violin Concerto in D Major, Op. 77",
    spotifyArtist: "Yehudi Menuhin",
  },
  "Harold Arlen Dies": {
    spotifyId: "568SEFtDjKr7N2PytpA6D5",
    spotifyTitle: "Over the Rainbow",
    spotifyArtist: "Judy Garland",
  },
  "Ordinary Opens At Number One": {
    spotifyId: "6kesIBNAY17BoAz28pnWMC",
    spotifyTitle: "Run",
    spotifyArtist: "Snow Patrol",
  },
  "We Are The World Tops The UK Chart": {
    spotifyId: "3Z2tPWiNiIpg8UMMoowHIk",
    spotifyTitle: "We Are the World",
    spotifyArtist: "USA for Africa",
  },
  "Johnny Griffin Is Born": {
    spotifyId: "2J8Fuy0kXrRCB0u2GtJY9d",
    spotifyTitle: "Introducing Johnny Griffin",
    spotifyArtist: "Johnny Griffin",
  },
  "Count Basie Dies": {
    spotifyId: "6DDhXGwCHmzT3EVoXr9lS2",
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
  
  let updated = 0;
  for (const item of items) {
    const matchKey = Object.keys(VERIFIED_IDS).find(k => item.title.includes(k));
    if (matchKey) {
      const mapping = VERIFIED_IDS[matchKey];
      await supabase
        .from("briefing_items")
        .update({ metadata_spotify_track_id: mapping })
        .eq("id", item.id);
      console.log(`🎵 ${item.title} -> ${mapping.spotifyId} (${mapping.spotifyTitle})`);
      updated++;
    } else {
      console.log(`⚠️  No match: ${item.title}`);
    }
  }
  console.log(`\nUpdated ${updated}/${items.length} music cards.`);
}

main().catch(console.error);
