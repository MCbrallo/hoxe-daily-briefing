import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: items } = await supabase
    .from("briefing_items")
    .select("id, title, category, metadata_spotify_track_id")
    .not("metadata_spotify_track_id", "is", null);
  
  if (!items) return;
  console.log(`Total music cards: ${items.length}\n`);
  
  for (const item of items) {
    const meta = typeof item.metadata_spotify_track_id === 'string' 
      ? JSON.parse(item.metadata_spotify_track_id) 
      : item.metadata_spotify_track_id;
    
    console.log(`[${item.category.padEnd(15)}] ${item.title.substring(0,45).padEnd(45)} | spotifyId: ${meta.spotifyId || 'NONE'} | deezerId: ${meta.deezerId || 'NONE'}`);
  }
}

main().catch(console.error);
