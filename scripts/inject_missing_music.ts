import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const HIT_POOL = [
  { t: "The Beatles Release Their Final Studio Album", s: "The Beatles Let It Be", y: "1970", m: "The Beatles' twelfth and final studio album 'Let It Be' is released, defining an era and marking the poignant end of the most influential band in history." },
  { t: "Michael Jackson Unleashes Thriller", s: "Michael Jackson Thriller", y: "1982", m: "Changing pop culture forever, Michael Jackson releases 'Thriller'. Its groundbreaking music videos and genre-blending sound make it the best-selling album of all time." },
  { t: "Nirvana Defines A Generation With Nevermind", s: "Nirvana Smells Like Teen Spirit", y: "1991", m: "Nirvana's explosive grunge anthem completely disrupts the mainstream music industry, pulling alternative rock into the global spotlight overnight." },
  { t: "Queen Records Bohemian Rhapsody", s: "Queen Bohemian Rhapsody", y: "1975", m: "Despite record executives claiming the six-minute operatic rock song was too long for radio, Queen releases what becomes one of the greatest rock anthems ever produced." },
  { t: "Aretha Franklin Demands Respect", s: "Aretha Franklin Respect", y: "1967", m: "Aretha Franklin transforms an Otis Redding song into a monumental feminist and civil rights anthem that earns her the indisputable title of the Queen of Soul." },
  { t: "Eminem Drops The Marshall Mathers LP", s: "Eminem The Real Slim Shady", y: "2000", m: "Eminem releases his critically acclaimed, highly controversial masterpiece, shattering first-week sales records and redefining hip-hop for the new millennium." },
  { t: "Prince Dominates With Purple Rain", s: "Prince Purple Rain", y: "1984", m: "Accompanying his blockbuster film debut, Prince releases a masterpiece that flawlessly blends rock, R&B, and pop, establishing his legendary musical genius." },
  { t: "Adele Sweeps With 21", s: "Adele Rolling in the Deep", y: "2011", m: "Adele's hauntingly personal second studio album becomes a global juggernaut, reviving soulful vocal pop and breaking countless modern chart records." },
  { t: "Daft Punk Resurrects Disco", s: "Daft Punk Get Lucky", y: "2013", m: "The enigmatic French electronic duo partners with Pharrell Williams to release a globally infectious summer anthem that brings pure funk and disco back to mainstream radio." },
  { t: "Johnny Cash Performs At Folsom Prison", s: "Johnny Cash Folsom Prison Blues", y: "1968", m: "In a defiant and iconic career-defining moment, Johnny Cash records a live album inside Folsom State Prison, revitalizing his career and the outlaw country genre." },
  { t: "Lady Gaga Revitalizes Pop", s: "Lady Gaga Bad Romance", y: "2009", m: "With theatrical flair, avant-garde fashion, and relentless electronic hooks, Lady Gaga releases an era-defining anthem that reshapes the entire landscape of 2010s pop music." },
  { t: "Tupac Drops All Eyez On Me", s: "2Pac California Love", y: "1996", m: "Fresh out of prison, Tupac Shakur releases hip-hop's first double-disc album, an expansive, cinematic masterpiece that solidifies his legacy in West Coast rap." },
  { t: "Fleetwood Mac Releases Rumours", s: "Fleetwood Mac Dreams", y: "1977", m: "Born from intense internal band drama and romantic breakups, Fleetwood Mac channels their pain into one of the most flawless and universally beloved rock albums ever." },
  { t: "Kendrick Lamar Wins A Pulitzer", s: "Kendrick Lamar HUMBLE.", y: "2018", m: "Kendrick Lamar becomes the first non-classical or jazz artist to win the Pulitzer Prize for Music for his profound album 'DAMN.', elevating hip-hop to unprecedented critical prestige." },
  { t: "Madonna Invents The Modern Pop Tour", s: "Madonna Like a Prayer", y: "1989", m: "Madonna pushes the boundaries of music, religion, and concert performance, cementing her reign as the ultimate provocateuse and architect of the modern pop spectacle." },
  { t: "The Rolling Stones Demand Satisfaction", s: "The Rolling Stones Satisfaction", y: "1965", m: "Driven by a fuzz-guitar riff that came to Keith Richards in a dream, the Stones release a rebellious anthem that embodies the chaotic energy of the 1960s." },
  { t: "Eminem Drops Lose Yourself", s: "Eminem Lose Yourself", y: "2002", m: "Eminem scores an explosive hit for the '8 Mile' soundtrack, creating an unstoppable motivational anthem that eventually becomes the first rap song to win an Oscar." },
  { t: "Beyoncé Releases A Surprise Visual Album", s: "Beyoncé Drunk in Love", y: "2013", m: "Changing industry rules overnight, Beyoncé drops her self-titled album without any prior warning or marketing, establishing the 'surprise drop' as the modern golden standard." },
  { t: "Outkast Shakes The World", s: "Outkast Hey Ya!", y: "2003", m: "Andre 3000 unleashes a miraculously infectious fusion of funk, pop, and rock. The genreless masterpiece dominates global culture and forces everyone to 'shake it like a Polaroid picture'." },
  { t: "Bob Dylan Goes Electric", s: "Bob Dylan Like a Rolling Stone", y: "1965", m: "Shattering folk music purist conventions, Bob Dylan plugs in his electric guitar to record a sprawling, visionary six-minute track that revolutionizes lyrical songwriting for rock music." },
  { t: "Dr. Dre Releases The Chronic", s: "Dr. Dre Nuthin' But A G Thang", y: "1992", m: "Dr. Dre pioneers the smooth, synthesizer-heavy G-funk sound, instantly shifting the epicenter of hip-hop to Los Angeles and launching the career of Snoop Dogg." },
  { t: "Whitney Houston Covers Dolly Parton", s: "Whitney Houston I Will Always Love You", y: "1992", m: "For the soundtrack of 'The Bodyguard', Whitney Houston delivers a transcendent, powerhouse vocal performance that becomes one of the best-selling singles by a woman in music history." },
  { t: "The Sugarhill Gang Launches Hip-Hop", s: "Sugarhill Gang Rapper's Delight", y: "1979", m: "Hip-hop officially breaches mainstream culture as this infectious, disco-infused track introduces rapping to a global audience, laying the foundation for a billion-dollar cultural empire." },
  { t: "Radiohead Drops OK Computer", s: "Radiohead Paranoid Android", y: "1997", m: "Rejecting the Britpop movement, Radiohead releases a deeply anxious, atmospheric masterpiece that perfectly captures the alienation of the approaching digital age." },
  { t: "Lauryn Hill Drops Her Masterpiece", s: "Lauryn Hill Doo Wop (That Thing)", y: "1998", m: "With unparalleled artistry in both rapping and singing, Lauryn Hill releases her legendary debut solo album, dominating the Grammys and breaking barriers for women in hip-hop." },
  { t: "Bruce Springsteen Releases Born To Run", s: "Bruce Springsteen Born To Run", y: "1975", m: "Desperate for a breakthrough, Springsteen pours everything into an anthemic, Wall-of-Sound rock epic that speaks to the dreams and frustrations of working-class youth." },
  { t: "The White Stripes Pioneer Garage Rock Revival", s: "The White Stripes Seven Nation Army", y: "2003", m: "Using a semi-acoustic guitar mimicking a heavy bassline, Jack White writes a stadium-sized riff that quickly becomes an immortal chant sung by sports crowds worldwide." },
  { t: "Marvin Gaye Asks What's Going On", s: "Marvin Gaye What's Going On", y: "1971", m: "Departing from traditional Motown pop, Marvin Gaye self-produces a politically charged, deeply soulful concept album that addresses war, poverty, and environmental destruction." },
  { t: "The Clash Unleashes London Calling", s: "The Clash London Calling", y: "1979", m: "The Clash expands the horizons of punk rock by boldly blending reggae, rockabilly, and ska into an apocalyptically urgent double album that defines late-70s rebellion." },
  { t: "Jay-Z Drops The Blueprint", s: "Jay-Z Izzo (H.O.V.A.)", y: "2001", m: "Released on a historic day of tragedy, Jay-Z's soulful, sample-heavy album produced heavily by a young Kanye West solidifies his untouchable status as the King of New York." },
  { t: "Amy Winehouse Issues Back To Black", s: "Amy Winehouse Rehab", y: "2006", m: "Blending raw emotional torment with a brilliant 1960s girl-group Motown revivalism, Amy Winehouse creates a devastatingly honest portrait of heartbreak and addiction." },
  { t: "The Notorious B.I.G. Drops Ready To Die", s: "The Notorious B.I.G. Juicy", y: "1994", m: "Biggie Smalls releases a spectacular debut that merges gritty street narratives with extremely polished, radio-friendly hooks, instantly breathing life back into East Coast rap." },
  { t: "Guns N' Roses Welcomes You To The Jungle", s: "Guns N' Roses Sweet Child O' Mine", y: "1987", m: "Injecting dangerous, raw swagger back into a saturated hard rock scene, the band's ferocious debut album shatters sales records and restores rock's reckless spirit." },
  { t: "David Bowie Unveils Ziggy Stardust", s: "David Bowie Starman", y: "1972", m: "Bowie adopts an alien rock-star alter ego, pioneering glam rock with an incredibly theatrical concept album that explores themes of fame, space, and sexual fluidity." },
];

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  return "BQBg6SyOg75ED-_X00I0HkMXVNur9s_1TXbdju3rIGAUAbZF15MIqA00ujMsOBv9DW8V87GEAZiNStyrAE3BVCyyZNx6CqkAgZk9YAanjwFEHgWGgvnXkz-Jgmx7VwLZm-gbtDrMTLE";
}

async function searchSpotify(query: string): Promise<any | null> {
  const token = await getSpotifyToken();
  if (!token) return null;
  try {
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    const r = await fetch(searchUrl, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (r.ok) {
      const data = await r.json();
      const t = data.tracks?.items?.[0];
      if (t) {
        return {
          spotifyId: t.id,
          spotifyTitle: t.name,
          spotifyArtist: t.artists[0]?.name || '',
          spotifyCover: t.album?.images[0]?.url || ''
        };
      }
    }
  } catch {}
  return null;
}

async function run() {
  console.log("=== INJECTING MISSING MUSIC CARDS ===");
  const { data: days } = await s.from("daily_briefings").select("id, date").order("id", { ascending: true });
  if (!days) return;

  const missingDays: {id:number, date:string}[] = [];

  for (const day of days) {
    const { data: items } = await s.from("briefing_items").select("id, metadata_spotify_track_id, category").eq("briefing_id", day.id);
    let hasMusic = false;
    for (const item of items || []) {
      if ((item.category === "music" || item.category === "viral_music") && item.metadata_spotify_track_id) {
        hasMusic = true;
        break;
      }
    }
    if (!hasMusic) {
      missingDays.push({ id: day.id, date: day.date });
    }
  }

  console.log(`Found ${missingDays.length} days missing a valid music card.`);
  
  // Shuffle HIT_POOL randomly
  HIT_POOL.sort(() => 0.5 - Math.random());
  
  let poolIdx = 0;
  let injected = 0;

  for (const day of missingDays) {
    const hit = HIT_POOL[poolIdx % HIT_POOL.length];
    poolIdx++;

    process.stdout.write(`Injecting "${hit.s}" into ${day.date}... `);
    
    const track = await searchSpotify(hit.s);
    if (track) {
      const { error } = await s.from("briefing_items").insert({
        briefing_id: day.id,
        app_date: day.date,
        event_date: `${hit.y}`,
        year: hit.y,
        category: "music",
        title: hit.t,
        short_explanation: "A defining moment in musical history that shaped global culture.",
        why_it_matters: hit.m,
        metadata_spotify_track_id: JSON.stringify(track),
        language: 'en'
      });
      if (error) {
        console.log(`❌ DB Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
        injected++;
      }
    } else {
      console.log(`❌ Spotify search failed.`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\nInjected ${injected} music cards!`);
}
run();
