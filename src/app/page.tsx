"use client";

import { useState, useEffect, useRef } from "react";
import { type BriefingItem } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Bookmark, Share } from "lucide-react";
import { cn } from "@/utils/cn";
import { MusicPlayerCard } from "@/components/MusicPlayerCard";
import { useSavedCards } from "@/hooks/useSavedCards";

const CATEGORY_COLORS = [
  { text: "text-[#7F1D1D]", border: "border-[#7F1D1D]" }, // dark red
  { text: "text-[#1E3A8A]", border: "border-[#1E3A8A]" }, // dark blue
  { text: "text-[#14532D]", border: "border-[#14532D]" }, // dark green
  { text: "text-[#701A75]", border: "border-[#701A75]" }, // fuchsia
  { text: "text-[#9A3412]", border: "border-[#9A3412]" }, // rust
  { text: "text-[#0F766E]", border: "border-[#0F766E]" }, // teal
  { text: "text-[#162740]", border: "border-[#162740]" }, // slate
];

export default function TodayPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Data
  useEffect(() => {
    async function fetchTodayData() {
      const params = new URLSearchParams(window.location.search);
      const targetDate = params.get('date');
      
      const CATEGORY_ORDER: Record<string, number> = { history: 1, science: 2, space: 3, culture: 4, people: 5, warfare: 6, sports: 7, curiosity: 8, local: 9, observance: 10, music: 11 };

      let query = supabase.from('daily_briefings').select(`*, briefing_items (*)`).order('created_at', { ascending: false });

      if (targetDate) {
        // If an admin requests a specific pre-generated date
        query = query.eq('date', targetDate);
      } else {
        // Normal user logic: We need the briefing for exactly 'Today'
        const todayStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
        query = query.eq('date', todayStr);
      }

      const { data, error } = await query.limit(1).single();
      
      const mapPayload = (dbNode: any) => {
        return {
          date: dbNode.date,
          dayOfWeek: dbNode.day_of_week,
          items: dbNode.briefing_items.map((it: any) => ({
            id: it.id,
            category: it.category,
            title: it.title,
            year: it.year,
            shortExplanation: it.short_explanation,
            whyItMatters: it.why_it_matters,
            imageUrl: it.image_url,
            imageSource: it.image_source,
            metadata: it.metadata_spotify_track_id ? { spotifyTrackId: it.metadata_spotify_track_id } : undefined
          })).sort((a: any, b: any) => (CATEGORY_ORDER[a.category] || 99) - (CATEGORY_ORDER[b.category] || 99))
        }
      }

      if (data && !error) {
        setBriefing(mapPayload(data));
      } else {
        // Fallback or previewing logic loop (if fails, fetch latest available regardless)
        const { data: fallback } = await supabase.from('daily_briefings').select(`*, briefing_items (*)`).order('created_at', { ascending: false }).limit(1).single();
        if (fallback) setBriefing(mapPayload(fallback));
      }
    }
    fetchTodayData();
  }, []);

  // 2. Lock Body Scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // 3. Native Vertical Snap Tracking Observer
  useEffect(() => {
    if (!slideContainerRef.current || !briefing) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const index = Number(entry.target.getAttribute('data-index'));
          setCurrentSlide((prev) => {
             if (prev !== index) return index;
             return prev;
          });
        }
      });
    }, {
      root: slideContainerRef.current,
      threshold: 0.51
    });

    const slides = slideContainerRef.current.querySelectorAll('.hoxe-slide');
    slides.forEach(slide => observer.observe(slide));

    return () => observer.disconnect();
  }, [briefing]);

  if (!briefing) {
    return (
      <div className="flex flex-col h-[100dvh] w-screen items-center justify-center bg-mist-white">
        <div className="w-8 h-8 rounded-full border-t-2 border-ink-navy animate-spin opacity-50" />
      </div>
    );
  }

  const totalSlides = briefing.items.length + 1;
  const uniqueCategories = Array.from(new Set(briefing.items.map((item: any) => item.category)));

  const getCategoryColor = (cat: string) => {
    const idx = uniqueCategories.indexOf(cat as any);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  };

  const goNext = () => {
    if (!slideContainerRef.current) return;
    const scrollAmount = window.innerHeight;
    slideContainerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  };

  const handleJump = (cat: string) => {
    if (!slideContainerRef.current) return;
    const firstIndex = briefing.items.findIndex((item: any) => item.category === cat) + 1;
    const targetElement = slideContainerRef.current.querySelector(`.hoxe-slide[data-index="${firstIndex}"]`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-mist-white text-ink-navy font-sans fixed inset-0 z-40 mt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:mt-0 pt-0 md:pt-16">
      
      <div className="absolute inset-4 md:inset-8 border border-ink-navy/5 pointer-events-none rounded-xl z-0" />

      <div className="relative flex-1 w-full h-full flex items-center justify-center z-10 overflow-hidden">
        
        <div 
          ref={slideContainerRef}
          className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {/* --- Slide 0: The Editorial Landing --- */}
          <section data-index={0} className="hoxe-slide min-h-[100dvh] w-full h-full shrink-0 snap-center relative flex flex-col items-center justify-center px-6 md:px-16 transition-opacity">
            <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 md:px-16 transition-opacity duration-700", currentSlide === 0 ? "opacity-100" : "opacity-0 pointer-events-none")}>
              
               {/* Mobile Logo Header */}
               <div className="absolute top-6 left-6 flex items-center gap-3 md:hidden z-50 animate-fade-rise">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-navy">
                   <path d="M10 3 H 6a2 2 0 0 0 -2 2 v 14a2 2 0 0 0 2 2 h 12a2 2 0 0 0 2 -2 V 5a2 2 0 0 0 -2 -2 h -4" />
                   <path d="M 8 8 L 16 16" />
                   <path d="M 16 8 L 8 16" />
                 </svg>
                 <span className="font-bold tracking-[0.25em] text-[13px] text-ink-navy pt-[1px]">HOXE</span>
               </div>

               <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
                 <div className="absolute w-[600px] h-[600px] rounded-full bg-atlantic-blue/[0.03] blur-[120px] -top-[200px] -left-[200px] animate-[drift_25s_ease-in-out_infinite]" />
                 <div className="absolute w-[500px] h-[500px] rounded-full bg-slate-blue/[0.04] blur-[100px] -bottom-[150px] -right-[150px] animate-[drift_30s_ease-in-out_infinite_reverse]" />
                 <div className="absolute w-[350px] h-[350px] rounded-full bg-eucalyptus/[0.03] blur-[80px] top-1/3 right-1/4 animate-[drift_20s_ease-in-out_infinite_0.5s]" />
               </div>

               <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center relative z-10">
                 
                 <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
                   
                   <span className="text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-ink-navy/50 animate-fade-rise">
                     {briefing.dayOfWeek}
                   </span>
                   
                   <h1 className="font-serif text-[28vw] md:text-[24vh] lg:text-[28vh] text-ink-navy leading-[0.8] tracking-tighter mt-1 md:mt-2 animate-fade-rise animate-delay-1 hover:text-slate-blue hover:drop-shadow-[0_0_20px_rgba(27,46,75,0.15)] transition-all duration-[1200ms] cursor-default">
                     {briefing.date}
                   </h1>

                   <div className="flex flex-col items-center md:items-start mt-12 md:mt-16 animate-fade-rise animate-delay-2 w-full">
                     <div className="w-10 h-[1px] bg-ink-navy/20 mb-6"></div>
                     <p className="text-xs md:text-sm font-medium tracking-[0.25em] uppercase text-ink-navy/70 overflow-hidden">
                       <span className="inline-block animate-[slideUp_1s_ease-out_0.6s_both]">
                         What defined this day across time and space.
                       </span>
                     </p>
                   </div>

                   <button 
                     onClick={goNext}
                     className="mt-8 md:mt-12 group flex items-center gap-3 bg-ink-navy text-mist-white px-8 py-4 text-[11px] font-bold tracking-[0.25em] uppercase hover:bg-slate-blue transition-all duration-300 focus:outline-none animate-fade-rise animate-delay-4"
                   >
                     Explore the day
                     <ChevronRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                 </div>

                 <div className="md:col-span-6 lg:col-span-5 animate-fade-rise animate-delay-3 md:-mt-4 lg:-mt-8">
                   <div className="flex flex-col">
                     {uniqueCategories.slice(0, 4).map((cat: any, i: number) => {
                       const item = briefing.items.find((it: any) => it.category === cat);
                       if (!item) return null;
                       const catLabel = cat === "local" ? "Local Lens" : cat.charAt(0).toUpperCase() + cat.slice(1);
                       const colorObj = getCategoryColor(cat);
                       
                       return (
                         <button
                           key={cat}
                           onClick={() => handleJump(cat)}
                           className={cn(
                             "group w-full flex flex-col justify-start py-5 md:py-[22px] px-5 md:px-7 hover:bg-warm-white/50 transition-all text-left",
                             i === 0 ? "border-t border-ink-navy/10" : "",
                             "border-b border-ink-navy/8"
                           )}
                         >
                           <div className="flex w-full items-center justify-between">
                             <div className="flex-1 min-w-0 pr-4">
                               <div className="flex items-center gap-3 mb-1.5">
                                 <span className={cn("text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase", colorObj.text)}>
                                   {catLabel}
                                 </span>
                                 {item.year && (
                                   <span className="text-[10px] font-serif italic text-ink-navy/30">{item.year}</span>
                                 )}
                               </div>
                               <span className="text-base md:text-lg font-serif text-ink-navy/90 group-hover:text-ink-navy transition-colors block leading-snug">
                                 {item.title}
                               </span>
                             </div>
                             <div className="pl-2">
                               <ChevronRight size={14} strokeWidth={2} className="text-ink-navy/20 group-hover:text-ink-navy/60 group-hover:translate-x-1.5 transition-all shrink-0" />
                             </div>
                           </div>
                         </button>
                       );
                     })}
                   </div>
                 </div>

               </div>
            </div>
          </section>

          {/* --- Slides 1-N: Categories --- */}
          {briefing.items.map((item: any, idx: number) => {
            const slideIndex = idx + 1;
            const isActive = currentSlide === slideIndex;
            
            return (
              <section 
                data-index={slideIndex} 
                key={item.id} 
                className="hoxe-slide min-h-[100dvh] w-full h-full shrink-0 snap-center relative flex flex-col px-10 md:px-20 lg:px-28 pt-16 md:pt-[68px]"
              >
                <div className={cn("w-full h-full transition-opacity duration-700", isActive ? "opacity-100" : "opacity-0 pointer-events-none")}>
                 <CategorySlideContent item={item} index={idx} isActive={isActive} />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Category Navigation (Dots on Mobile, Text Bar on Desktop) */}
      <div className={cn(
        "absolute z-50 flex transition-all duration-1000 ease-in-out pointer-events-none",
        currentSlide > 0 ? "opacity-100 pointer-events-auto" : "opacity-0",
        // Mobile style: right aligned dots at 50% height
        "right-4 top-1/2 -translate-y-1/2 flex-col",
        // Desktop style: bottom aligned centered bar
        "md:right-auto md:top-auto md:bottom-0 md:transform-none md:w-full md:flex-row md:justify-center md:pb-5 md:pt-10 md:bg-gradient-to-t md:from-mist-white md:via-mist-white/80 md:to-transparent"
      )}>
        <nav className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-3 md:gap-10 md:px-6">
           {uniqueCategories.map((catLabel: any) => {
              const currentCategoryName = currentSlide > 0 ? briefing.items[currentSlide - 1].category : '';
              const isActive = currentCategoryName === catLabel;
              const colorObj = getCategoryColor(catLabel);

              return (
                <button 
                  key={catLabel} 
                  onClick={() => handleJump(catLabel)}
                  title={catLabel}
                  className={cn(
                    "transition-all duration-300",
                    // Mobile dot mechanics
                    "w-1.5 h-1.5 rounded-full ring-2 ring-offset-2 ring-offset-mist-white cursor-pointer",
                    isActive ? "bg-slate-blue ring-slate-blue/20" : "bg-ink-navy/20 ring-transparent",
                    // Desktop text mechanics override
                    "md:w-auto md:h-auto md:rounded-none md:ring-0 md:bg-transparent md:cursor-pointer md:ring-offset-0",
                    "md:text-[11px] md:font-bold md:tracking-[0.25em] md:uppercase md:pb-2 md:border-b-[3px]",
                    isActive ? `md:${colorObj.text} md:${colorObj.border}` : "md:text-ink-navy/30 md:border-transparent md:hover:text-ink-navy/60"
                  )}
                >
                  <span className="hidden md:inline">{catLabel === 'local' ? 'Local Lens' : catLabel}</span>
                </button>
              )
           })}
        </nav>
      </div>

    </div>
  );
}

function CategorySlideContent({ item, index, isActive }: { item: BriefingItem; index: number; isActive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { toggleCard, isSaved } = useSavedCards();
  const saved = isSaved(item.id);
  const isMusic = item.category === "music";
  const hasSpotify = isMusic && item.metadata?.spotifyTrackId;
  const showImage = !isMusic && item.imageUrl;

  const catColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => setExpanded(false), 300);
    }
  }, [isActive]);

  return (
    <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 h-full" style={{ gridTemplateRows: 'auto auto 1fr' }}>
      
      <div className="col-span-full">
        <div className="flex items-center justify-between border-b border-ink-navy/10 pb-2.5">
          <span className={cn("text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase", catColor.text)}>
            {index + 1 < 10 ? `0${index + 1}` : index + 1} — {item.category === "local" ? "LOCAL LENS" : item.category.toUpperCase()}
          </span>
          <div className="flex items-center gap-4 md:gap-6">
            {item.year && (
              <span className="font-serif text-[12px] md:text-base italic text-ink-navy/60 pr-4 border-r border-ink-navy/20">{item.year}</span>
            )}
            <button 
              onClick={() => toggleCard(item)}
              className={cn("transition-colors focus:outline-none", saved ? "text-ink-navy" : "text-ink-navy/40 hover:text-ink-navy")} 
              title={saved ? "Remove from Saved" : "Save"}
            >
              <Bookmark size={16} strokeWidth={1.5} className={saved ? "fill-current" : ""} />
            </button>
            <button className="text-ink-navy/40 hover:text-ink-navy transition-colors focus:outline-none" title="Share">
              <Share size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className={cn("col-span-full self-start", (hasSpotify || showImage) ? "md:col-span-7" : "")}>
        <h2 className={cn(
          "font-serif text-ink-navy leading-[1.05] tracking-tight transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] origin-left",
          expanded ? "text-2xl md:text-3xl" : "text-[2rem] md:text-[3rem]"
        )}>
          {item.title}
        </h2>
      </div>

      {(hasSpotify || showImage) && (
        <div className="col-span-full md:col-span-5 md:row-span-2 md:col-start-8 md:row-start-2 mb-4 md:mb-0 pt-2 z-10 hidden md:block">
          {hasSpotify && (
            <MusicPlayerCard
              title={item.title}
              artist={item.metadata!.artist || "Unknown Artist"}
              spotifyTrackId={item.metadata!.spotifyTrackId!}
            />
          )}
          {showImage && (
            <div className="relative w-full flex flex-col group mt-1">
              <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.display = 'none'; }} className="w-full h-auto max-h-[60vh] object-cover filter grayscale hover:grayscale-0 transition-all duration-[1500ms]" />
              <div className="w-full relative mt-3">
                <div className="w-full h-[1px] bg-ink-navy/10 mb-2" />
                <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold text-ink-navy/40 text-right w-full block">{item.imageSource}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={cn(
        "col-span-full gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-16 md:pb-14 items-start",
        (hasSpotify || showImage) ? "md:col-span-7" : "grid grid-cols-1"
      )}>
        <div className="flex flex-col">
          {hasSpotify && (
            <div className="col-span-full mb-6 md:hidden">
              <MusicPlayerCard
                title={item.title}
                artist={item.metadata!.artist || "Unknown Artist"}
                spotifyTrackId={item.metadata!.spotifyTrackId!}
              />
            </div>
          )}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-2.5 mb-3 text-ink-navy hover:text-slate-blue transition-all focus:outline-none"
        >
          <span className="w-5 h-[1px] bg-ink-navy/30 group-hover:bg-slate-blue group-hover:w-7 transition-all" />
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
            {expanded ? "Close Context" : "Read Context"}
          </span>
        </button>

        <div className={cn(
          "grid transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          expanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}>
          <div className="overflow-hidden min-h-0">
            <p className="text-ink-navy/75 text-base md:text-lg leading-relaxed md:leading-[1.65] font-medium">
              {item.shortExplanation}
            </p>
          </div>
        </div>

        <div className={cn(
          "grid transition-all duration-[800ms] delay-100 ease-[cubic-bezier(0.23,1,0.32,1)]",
          expanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
        )}>
          <div className="overflow-hidden min-h-0">
            <div className="text-sm md:text-base text-ink-navy/85 leading-[1.7] md:leading-[1.75] font-serif space-y-4 text-justify">
              {item.whyItMatters.split('\n\n').map((paragraph: any, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Image Layer (parte baja) */}
        {showImage && (
          <div className="col-span-full mt-10 mb-8 md:hidden relative left-1/2 -ml-[50vw] w-screen flex flex-col items-end">
            <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-auto object-cover filter grayscale" />
            <div className="w-full relative mt-3 px-6 h-full flex flex-col pb-4">
              <div className="w-full h-[1px] bg-ink-navy/10 mb-2" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-ink-navy/40 text-right w-full block">{item.imageSource}</span>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
