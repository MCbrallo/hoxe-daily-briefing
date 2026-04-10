export interface BriefingItem {
  id: string;
  category: "history" | "local" | "music" | "science" | "observance" | "people" | "curiosity" | "warfare" | "sports" | "space" | "culture";
  title: string;
  year?: string;
  shortExplanation: string;
  whyItMatters: string;
  countryRelevance?: string;
  metadata?: {
    artist?: string;
    composer?: string;
    spotifyTrackId?: string;
    youtubeVideoId?: string;
    albumArt?: string;
  };
}

export const april10Briefing = {
  date: "April 10",
  dayOfWeek: "Friday",
  countryEmphasis: "Spain",
  readTimeMin: 3,
  introAtmosphere: "A day marked by monumental political shifts, iconic studio sessions in London, and our first actual glimpse into the abyss.",
  closingSummary: "The past does not rest. It is waiting to be remembered.",
  items: [
    {
      id: "history-1",
      category: "history",
      title: "Titanic departs on its maiden voyage",
      year: "1912",
      shortExplanation: "RMS Titanic left Southampton for New York on April 10, 1912.",
      whyItMatters: "On April 10, 1912, the RMS Titanic cast off from Berth 44 in Southampton. She carried roughly 1,846 passengers and crew on departure, stopping in France and Ireland before attempting her Atlantic crossing. Her subsequent sinking fundamentally reshaped the world's maritime safety laws, directly leading to the SOLAS convention that mandated adequate lifeboats and continuous radio watches for all passenger vessels.",
    },
    {
      id: "history-2",
      category: "history",
      title: "Good Friday Agreement is signed",
      year: "1998",
      shortExplanation: "The Belfast, or Good Friday, Agreement was reached on April 10, 1998.",
      whyItMatters: "After thirty years of the devastating sectarian conflict known as The Troubles, political parties and governments brokered a historic peace at Stormont. The complex power-sharing architecture secured an end to systemic paramilitary warfare. Today, it stands globally as the gold standard for diplomatic intervention and democratic conflict resolution.",
    },
    {
      id: "warfare-1",
      category: "warfare",
      title: "Battle of Mohi",
      year: "1241",
      shortExplanation: "Mongol forces crushed the army of Hungary’s King Béla IV.",
      whyItMatters: "General Subutai engineered a masterclass in double-enveloping tactics that completely annihilated the heavy cavalry and Templar forces of the Hungarian army. It demonstrated that medieval European tactics were wholly obsolete against the Mongolian war machine, leaving the entire Pannonian Basin vulnerable until the sudden death of Ögedei Khan forced their retreat.",
    },
    {
      id: "sports-1",
      category: "sports",
      title: "Spyridon Louis wins the first Olympic marathon",
      year: "1896",
      shortExplanation: "Greece’s Spyridon Louis won the first Olympic marathon of the modern Games.",
      whyItMatters: "Racing before an ecstatic home crowd of 100,000 spectators at the Panathenaic Stadium, the Greek water-carrier rescued the host nation's athletic pride. Setting the standard for what would become the ultimate test of human endurance, his nearly three hour run cemented the marathon as the flagship event of the Olympic tradition.",
    },
    {
      id: "music-1",
      category: "music",
      title: "Paul McCartney announces his break with the Beatles",
      year: "1970",
      shortExplanation: "Paul McCartney announced that he was taking a break from the Beatles.",
      whyItMatters: "In a self-interview distributed alongside his debut solo album, McCartney effectively confirmed the sudden end of the world’s most influential band. Blindsiding his bandmates—especially John Lennon—it triggered a massive cultural turning point. The 1960s dream of collective revolution dissolved, making way for an era defined by fiercely independent solo ambition.",
      metadata: {
        artist: "The Beatles",
        spotifyTrackId: "0aym2LBJBk9DAYuHHutrIl",
      }
    },
    {
      id: "science-1",
      category: "science",
      title: "First image of a black hole is unveiled",
      year: "2019",
      shortExplanation: "The Event Horizon Telescope collaboration released the first direct image of a black hole.",
      whyItMatters: "By networking eight radio observatories across four continents, over 200 scientists effectively created an Earth-sized telescope capable of viewing the shadow of the supermassive black hole at the center of M87. The resulting fiery, asymmetric ring provided the ultimate visual proof of Albert Einstein’s general theory of relativity operating in the universe's most extreme conditions.",
    },
    {
      id: "space-1",
      category: "space",
      title: "BepiColombo completes its first Earth flyby",
      year: "2020",
      shortExplanation: "ESA and JAXA’s BepiColombo performed its first Earth flyby.",
      whyItMatters: "Sweeping within 12,677 kilometers of Earth, the ESA-JAXA joint spacecraft executed the first of nine critical gravity-assist maneuvers required to shed orbital velocity and reach Mercury. The complex mission represents one of the most ambitious engineering feats of the modern space age, plotting an agonizing seven-year orbital ballet sunward.",
    },
    {
      id: "culture-1",
      category: "culture",
      title: "The Great Gatsby is published",
      year: "1925",
      shortExplanation: "F. Scott Fitzgerald’s The Great Gatsby was published on April 10, 1925.",
      whyItMatters: "Initially suffering lukewarm sales that led a 44-year-old Fitzgerald to die believing it was a total failure, the novel experienced a miraculous postwar revival when the military shipped thousands of paperbacks to WWII soldiers. It eventually cemented its legacy as the definitive dissection of the American Dream, perfectly capturing the moral decay hiding behind infinite wealth.",
    },
    {
      id: "observance-1",
      category: "observance",
      title: "National Youth HIV & AIDS Awareness Day",
      year: "Today",
      shortExplanation: "An annual public-health observance addressing the impact of HIV on youth.",
      whyItMatters: "Recognized natively by the CDC, this designated observance drives critical national dialogues regarding youth vulnerability to HIV and AIDS. It forces public health infrastructure across the United States to prioritize testing, sex education, and barrier-free treatment access for young demographics who remain structurally at risk.",
    },
    {
      id: "observance-2",
      category: "observance",
      title: "Dolores Huerta Day in California",
      year: "Today",
      shortExplanation: "An official civic holiday legally designated by the state of California.",
      whyItMatters: "California legally sets aside April 10 to mandate civic remembrance of Dolores Huerta's sweeping contributions to organized labor and civil rights. As the co-founder of the United Farm Workers alongside César Chávez, her relentless organizing secured massive labor protections and fundamentally reshaped the political leverage of the American agricultural workforce.",
    },
    {
      id: "observance-3",
      category: "observance",
      title: "Chris Hani remembrance in South Africa",
      year: "1993",
      shortExplanation: "Public memory and formal commemorations to mark the assassination of the ANC leader.",
      whyItMatters: "The 1993 murder of Chris Hani pushed a fracturing South Africa to the absolute brink of total civil war. Today, April 10 remains an agonizing, official day of reflection in South Africa, marking the sacrifice of the fierce anti-apartheid leader whose death ironically accelerated the inevitability of the nation's first democratic elections.",
    }
  ] as BriefingItem[],
};
