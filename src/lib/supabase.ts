import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ikmhbhvwjgzrylingkaq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yJ4H7fSDx6XHBgdb27hrfw_YINAOcfy";

export const supabase = createClient(supabaseUrl, supabaseKey);
