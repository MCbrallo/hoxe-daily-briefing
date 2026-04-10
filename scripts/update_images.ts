import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ikmhbhvwjgzrylingkaq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yJ4H7fSDx6XHBgdb27hrfw_YINAOcfy";

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGE_DATA = {
  "Titanic departs on its maiden voyage": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/RMS_Titanic_3.jpg",
    image_source: "Photo via Wikimedia Commons"
  },
  "First image of a black hole is unveiled": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg",
    image_source: "EHT Collaboration via Wikimedia Commons"
  },
  "The Great Gatsby is published": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/The_Great_Gatsby_cover_1925_%281%29.jpg",
    image_source: "Francis Cugat via Wikimedia Commons"
  },
  "Spyridon Louis wins the first Olympic marathon": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/1/12/Spyridon_Louis.jpg",
    image_source: "Albert Meyer via Wikimedia Commons"
  },
  "Battle of Mohi": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Battle_of_Mohi_1241.jpg",
    image_source: "Chronicon Pictum via Wikimedia Commons"
  },
  "Good Friday Agreement is signed": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Stormont_Parliament_Buildings_-_Belfast.jpg",
    image_source: "Photo via Wikimedia Commons"
  },
  "BepiColombo completes its first Earth flyby": {
    // A nice public domain shot of Mercury or spacecraft
    image_url: "https://upload.wikimedia.org/wikipedia/commons/b/b3/BepiColombo_in_cruise_configuration_%28transparent%29.png",
    image_source: "ESA/ATG medialab via Wikimedia Commons"
  },
  "National Youth HIV & AIDS Awareness Day": {
    image_url: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Red_Ribbon.svg",
    image_source: "Vector by Wikimedia Commons"
  }
};

async function updateImages() {
  console.log("Updating Supabase with rich imagery...");

  for (const [title, data] of Object.entries(IMAGE_DATA)) {
    const { error } = await supabase
      .from("briefing_items")
      .update({
        image_url: data.image_url,
        image_source: data.image_source
      })
      .eq("title", title);

    if (error) {
      console.error(`Failed to update ${title}:`, error.message);
    } else {
      console.log(`Successfully attached image for: ${title}`);
    }
  }
  console.log("Finished updating imagery.");
}

updateImages();
