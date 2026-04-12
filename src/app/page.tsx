"use client";

import { useState, useEffect, useRef } from "react";
import { type BriefingItem } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Bookmark, Share, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { MusicPlayerCard } from "@/components/MusicPlayerCard";
import { useSavedCards } from "@/hooks/useSavedCards";
import { useLanguage } from "@/context/LanguageContext";

const CATEGORY_COLOR_MAP: Record<string, { text: string; border: string; hex: string }> = {
  history:                   { text: "text-[#7F1D1D]", border: "border-[#7F1D1D]", hex: "#7F1D1D" },
  science:                   { text: "text-[#1E3A8A]", border: "border-[#1E3A8A]", hex: "#1E3A8A" },
  physics:                   { text: "text-[#312E81]", border: "border-[#312E81]", hex: "#312E81" },
  "biology and medicine":    { text: "text-[#14532D]", border: "border-[#14532D]", hex: "#14532D" },
  environment:               { text: "text-[#064E3B]", border: "border-[#064E3B]", hex: "#064E3B" },
  technology:                { text: "text-[#0F766E]", border: "border-[#0F766E]", hex: "#0F766E" },
  space:                     { text: "text-[#1E1B4B]", border: "border-[#1E1B4B]", hex: "#1E1B4B" },
  warfare:                   { text: "text-[#162740]", border: "border-[#162740]", hex: "#162740" },
  "politics and government": { text: "text-[#831843]", border: "border-[#831843]", hex: "#831843" },
  law:                       { text: "text-[#451A03]", border: "border-[#451A03]", hex: "#451A03" },
  "business and economy":    { text: "text-[#14532D]", border: "border-[#14532D]", hex: "#14532D" },
  culture:                   { text: "text-[#701A75]", border: "border-[#701A75]", hex: "#701A75" },
  music:                     { text: "text-[#6D28D9]", border: "border-[#6D28D9]", hex: "#6D28D9" },
  "film and television":     { text: "text-[#4C1D95]", border: "border-[#4C1D95]", hex: "#4C1D95" },
  "art and architecture":    { text: "text-[#9F1239]", border: "border-[#9F1239]", hex: "#9F1239" },
  literature:                { text: "text-[#581C87]", border: "border-[#581C87]", hex: "#581C87" },
  philosophy:                { text: "text-[#0F172A]", border: "border-[#0F172A]", hex: "#0F172A" },
  religion:                  { text: "text-[#78350F]", border: "border-[#78350F]", hex: "#78350F" },
  exploration:               { text: "text-[#1E40AF]", border: "border-[#1E40AF]", hex: "#1E40AF" },
  people:                    { text: "text-[#9A3412]", border: "border-[#9A3412]", hex: "#9A3412" },
  sports:                    { text: "text-[#B45309]", border: "border-[#B45309]", hex: "#B45309" },
  viral_quote:               { text: "text-[#475569]", border: "border-[#475569]", hex: "#475569" },
};
const DEFAULT_CAT_COLOR = { text: "text-[#334155]", border: "border-[#334155]", hex: "#334155" };

export default function TodayPage() {
  const { t, language, disabledCategories } = useLanguage();
  const [briefing, setBriefing] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Data
  useEffect(() => {
    async function fetchTodayData() {
      const params = new URLSearchParams(window.location.search);
      const targetDate = params.get('date');
      
      const CATEGORY_ORDER: Record<string, number> = { 
        history: 1, warfare: 2, "politics and government": 3, law: 4, "business and economy": 5, 
        science: 6, physics: 7, "biology and medicine": 8, environment: 9, technology: 10, space: 11, exploration: 12,
        culture: 13, "art and architecture": 14, literature: 15, "film and television": 16, music: 17, philosophy: 18, religion: 19,
        people: 20, sports: 21, viral_quote: 22 
      };

      // CANONICAL DATE: Always en-US for DB matching
      const todayStr = targetDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

      const mapPayload = (dbNode: any) => {
        return {
          date: dbNode.date,
          dayOfWeek: dbNode.day_of_week,
          items: (dbNode.briefing_items || [])
            .filter((it: any) => (!it.category.startsWith('viral_') || it.category === 'viral_quote') && !disabledCategories.includes(it.category))
            .map((it: any) => ({
              id: it.id,
              category: it.category,
              title: (language === 'es' ? it.title_es : language === 'gl' ? it.title_gl : null) || it.title,
              year: it.year,
              shortExplanation: (language === 'es' ? it.short_explanation_es : language === 'gl' ? it.short_explanation_gl : null) || it.short_explanation,
              whyItMatters: (language === 'es' ? it.why_it_matters_es : language === 'gl' ? it.why_it_matters_gl : null) || it.why_it_matters,
              imageUrl: it.image_url,
              imageSource: it.image_source,
              metadata: (() => {
                const raw = it.metadata_spotify_track_id;
                if (!raw) return undefined;
                try { return JSON.parse(raw); } catch { return { spotifyTrackId: raw }; }
              })()
            })).sort((a: any, b: any) => (CATEGORY_ORDER[a.category] || 99) - (CATEGORY_ORDER[b.category] || 99))
        }
      }

      // Safe query: match by date, no language filter (compatible pre/post migration)
      const { data: rows } = await supabase
        .from('daily_briefings')
        .select(`*, briefing_items (*)`)
        .eq('date', todayStr)
        .limit(1);

      if (rows && rows.length > 0) {
        setBriefing(mapPayload(rows[0]));
        return;
      }

      // Fallback: get the OLDEST briefing (not newest, to avoid showing future dates)
      const { data: fallbackRows } = await supabase
        .from('daily_briefings')
        .select(`*, briefing_items (*)`)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fallbackRows && fallbackRows.length > 0) {
        setBriefing(mapPayload(fallbackRows[0]));
      }
    }
    fetchTodayData();
  }, [language, disabledCategories]);

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
    return CATEGORY_COLOR_MAP[cat] || DEFAULT_CAT_COLOR;
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
        
        {/* Dynamic Persistent Mobile Logo Header */}
        <button 
          onClick={() => {
            if (currentSlide > 0 && slideContainerRef.current) {
              slideContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 flex flex-col items-center md:hidden z-50 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] origin-top",
            currentSlide === 0 
              ? "top-10 gap-2 scale-100 cursor-default animate-fade-rise" 
              : "top-[max(env(safe-area-inset-top),20px)] gap-2 scale-[0.65] cursor-pointer hover:opacity-80 bg-mist-white/60 backdrop-blur-md px-6 py-2 rounded-full shadow-[0_4px_16px_rgba(27,46,75,0.05)] text-ink-navy"
          )}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10 3 H 6a2 2 0 0 0 -2 2 v 14a2 2 0 0 0 2 2 h 12a2 2 0 0 0 2 -2 V 5a2 2 0 0 0 -2 -2 h -4" />
            <path d="M 8 8 L 16 16 M 16 8 L 8 16" />
          </svg>
          <span className="font-bold tracking-[0.3em] text-2xl uppercase mt-1">HOXE</span>
        </button>

        <div 
          ref={slideContainerRef}
          className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {/* --- Slide 0: The Editorial Landing --- */}
          <section data-index={0} className="hoxe-slide min-h-[100dvh] w-full h-full shrink-0 snap-center relative flex flex-col items-center justify-center px-6 md:px-16 transition-opacity">
            <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 md:px-16 transition-opacity duration-700", currentSlide === 0 ? "opacity-100" : "opacity-0 pointer-events-none")}>
              
 
               <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
                 <div className="absolute w-[600px] h-[600px] rounded-full bg-atlantic-blue/[0.03] blur-[120px] -top-[200px] -left-[200px] animate-[drift_25s_ease-in-out_infinite]" />
                 <div className="absolute w-[500px] h-[500px] rounded-full bg-slate-blue/[0.04] blur-[100px] -bottom-[150px] -right-[150px] animate-[drift_30s_ease-in-out_infinite_reverse]" />
                 <div className="absolute w-[350px] h-[350px] rounded-full bg-eucalyptus/[0.03] blur-[80px] top-1/3 right-1/4 animate-[drift_20s_ease-in-out_infinite_0.5s]" />
               </div>

               <div className="w-full h-full max-w-6xl mx-auto flex flex-col justify-center md:grid md:grid-cols-12 md:gap-14 md:items-center relative z-10">
                 
                 <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
                   
                   <span className="text-xl md:text-3xl font-bold tracking-[0.6em] md:tracking-[0.8em] uppercase text-ink-navy/60 animate-fade-rise">
                     {briefing.dayOfWeek}
                   </span>
                   
                   <h1 className="font-serif text-[28vw] md:text-[24vh] lg:text-[28vh] text-ink-navy leading-[0.8] tracking-tighter mt-1 md:mt-2 animate-fade-rise animate-delay-1 hover:text-slate-blue hover:drop-shadow-[0_0_20px_rgba(27,46,75,0.15)] transition-all duration-[1200ms] cursor-default">
                     {briefing.date}
                   </h1>

                   <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-ink-navy leading-tight tracking-tight mt-10 md:mt-12 font-medium animate-fade-rise animate-delay-2 hidden">
                     {t("ThePast")}<br/>
                     <span className="italic text-slate-blue font-light">{t("Present")}</span><br/>
                     {t("Pending")}
                   </h2>

                   <div className="flex flex-col items-center md:items-start mt-8 md:mt-8 animate-fade-rise animate-delay-2 w-full pt-4 md:pt-0">
                     <div className="w-12 h-[1.5px] bg-ink-navy/30 mb-6"></div>
                     <p className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-ink-navy/80 overflow-hidden text-center md:text-left leading-relaxed px-4 md:px-0">
                       <span className="inline-block animate-[slideUp_1s_ease-out_0.6s_both]">
                         {t("Tagline")}
                       </span>
                     </p>
                   </div>

                   {/* Desktop Button */}
                   <button 
                     onClick={goNext}
                     className="mt-8 md:mt-12 hidden md:flex group items-center gap-3 bg-ink-navy text-mist-white px-8 py-4 text-[11px] font-bold tracking-[0.25em] uppercase hover:bg-slate-blue transition-all duration-300 focus:outline-none animate-fade-rise animate-delay-4"
                   >
                     {t("ExploreDay")}
                     <ChevronRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                 </div>

                 {/* Mobile Chevron */}
                 <button 
                   onClick={goNext}
                   className="absolute bottom-36 md:bottom-32 left-1/2 -translate-x-1/2 animate-fade-rise animate-delay-4 transition-colors focus:outline-none md:hidden flex flex-col items-center gap-2"
                   aria-label="Scroll down"
                 >
                   <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-ink-navy/40 mb-[-10px]">{t("ScrollDown")}</span>
                   <ChevronDown size={64} strokeWidth={1} className="animate-bounce text-ink-navy/50 drop-shadow-sm translate-y-3 md:translate-y-4" />
                 </button>

                 {/* Desktop Category Previews */}
                 <div className="hidden md:flex md:col-span-6 lg:col-span-5 animate-fade-rise animate-delay-3 md:-mt-4 lg:-mt-8">
                   <div className="flex flex-col w-full">
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
                className="hoxe-slide min-h-[100dvh] w-full h-full shrink-0 snap-center relative flex flex-col pt-28 md:pt-[68px] transition-colors duration-500"
              >
                {/* Glass breathing borders */}
                <div 
                  className="absolute inset-y-0 left-0 w-[6px] animate-breathe pointer-events-none z-40" 
                  style={{ 
                    background: `linear-gradient(180deg, ${getCategoryColor(item.category).hex}00 0%, ${getCategoryColor(item.category).hex}CC 15%, ${getCategoryColor(item.category).hex} 50%, ${getCategoryColor(item.category).hex}CC 85%, ${getCategoryColor(item.category).hex}00 100%)`,
                    boxShadow: `4px 0 20px ${getCategoryColor(item.category).hex}30, 2px 0 8px ${getCategoryColor(item.category).hex}20`
                  }}
                />
                <div 
                  className="absolute inset-y-0 right-0 w-[6px] animate-breathe pointer-events-none z-40" 
                  style={{ 
                    background: `linear-gradient(180deg, ${getCategoryColor(item.category).hex}00 0%, ${getCategoryColor(item.category).hex}CC 15%, ${getCategoryColor(item.category).hex} 50%, ${getCategoryColor(item.category).hex}CC 85%, ${getCategoryColor(item.category).hex}00 100%)`,
                    boxShadow: `-4px 0 20px ${getCategoryColor(item.category).hex}30, -2px 0 8px ${getCategoryColor(item.category).hex}20`
                  }}
                />
                <div className="px-10 md:px-20 lg:px-28 h-full">
                <div className={cn("w-full h-full transition-opacity duration-700", isActive ? "opacity-100" : "opacity-0 pointer-events-none")}>
                 <CategorySlideContent item={item} index={idx} isActive={isActive} />
                </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Category Navigation (Dots on Mobile, Text Bar on Desktop) */}
      <div className={cn(
        "absolute z-50 flex transition-all duration-1000 ease-in-out pointer-events-none",
        currentSlide > 0 ? "opacity-100" : "opacity-0",
        // Mobile style: right aligned dots at 50% height
        "right-4 top-1/2 -translate-y-1/2 flex-col",
        // Desktop style: bottom aligned centered bar
        "md:right-auto md:top-auto md:bottom-0 md:transform-none md:w-full md:flex-row md:justify-center md:pb-5 md:pt-10 md:bg-gradient-to-t md:from-mist-white md:via-mist-white/80 md:to-transparent"
      )}>
        <nav className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-3 md:gap-10 md:px-6 pointer-events-auto">
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
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const { toggleCard, isSaved } = useSavedCards();
  const saved = isSaved(item.id);
  const isMusic = item.category === "music";
  const showImage = item.imageUrl;

  const catColor = CATEGORY_COLOR_MAP[item.category] || DEFAULT_CAT_COLOR;
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => setExpanded(false), 300);
      setShowShareMenu(false);
    }
  }, [isActive]);

  const handleShareLink = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `HOXE: ${item.title}`, url: window.location.href }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
    setShowShareMenu(false);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { 
        filter: (node: any) => !node.tagName?.includes('IFRAME') && node.id !== 'share-overlay',
        backgroundColor: '#F5F5F3', 
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `HOXE-${item.title.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Network error: Could not export card image directly.");
    }
    setShowShareMenu(false);
  };

  return (
    <div ref={cardRef} className="w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 h-full relative" style={{ gridTemplateRows: expanded ? 'auto 1fr' : 'auto 1fr auto' }}>
      
      {/* Share Overlay */}
      {showShareMenu && (
        <div id="share-overlay" className="absolute top-10 right-0 z-50 bg-white shadow-xl border border-ink-navy/10 rounded-2xl flex flex-col overflow-hidden animate-fade-rise">
          <button onClick={handleShareLink} className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/70 hover:bg-ink-navy/5 text-left border-b border-ink-navy/5">
            Share App Link
          </button>
          <button onClick={handleDownloadImage} className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/70 hover:bg-ink-navy/5 text-left">
            Save as Image
          </button>
        </div>
      )}
      
      <div className="col-span-full">
        <div className="flex items-center justify-between border-b border-ink-navy/10 pb-2.5">
          <span className={cn("text-[10px] md:text-[11px] font-bold tracking-[0.25em] uppercase", catColor.text)}>
            {index + 1 < 10 ? `0${index + 1}` : index + 1} — {item.category === "local" ? "LOCAL LENS" : item.category === "viral_quote" ? "IN MEMORIAM" : item.category.toUpperCase()}
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
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)} 
              className={cn("transition-colors focus:outline-none", showShareMenu ? "text-ink-navy" : "text-ink-navy/40 hover:text-ink-navy")} 
              title="Share"
            >
              <Share size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className={cn(
        "col-span-full flex flex-col items-center text-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
        expanded ? "justify-start pt-2" : "justify-center",
        showImage ? "md:col-span-7 md:items-start md:text-left" : ""
      )}>
        <h2 className={cn(
          "font-serif text-ink-navy tracking-tight transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          expanded ? "text-xl md:text-2xl leading-[1.15]" : "text-[2.75rem] md:text-[4.5rem] leading-[1.12]"
        )}>
          {item.title}
        </h2>
        <div className={cn(
          "grid transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] w-full",
          expanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}>
          <div className="overflow-hidden min-h-0">
            <p className="text-ink-navy/55 text-lg md:text-xl leading-relaxed md:leading-[1.65] font-medium mt-5">
              {item.shortExplanation}
            </p>
          </div>
        </div>

      </div>

      {showImage && (
        <div className="col-span-full md:col-span-5 md:row-span-2 md:col-start-8 md:row-start-2 mb-4 md:mb-0 pt-2 z-10 hidden md:block">
          <div className="relative w-full flex flex-col group mt-1 vintage-frame vintage-corners">
            <img 
              src={item.imageUrl!.includes('wiki') ? `https://wsrv.nl/?url=${item.imageUrl!.replace('https://', '')}&w=800` : item.imageUrl!} 
              alt={item.title} 
              loading="lazy" 
              referrerPolicy="no-referrer" 
              crossOrigin="anonymous" 
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.display = 'none'; }} 
              className="w-full h-auto max-h-[45vh] object-cover filter grayscale hover:grayscale-0 transition-all duration-[1500ms]" 
            />
            <div className="w-full relative mt-3">
              <div className="w-full h-[1px] bg-ink-navy/10 mb-2" />
              <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold text-ink-navy/40 text-right w-full block">{item.imageSource?.replace("Photo by", t("By"))}</span>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "col-span-full gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-28 md:pb-24 relative z-[55]",
        showImage ? "md:col-span-7" : "md:col-span-12 md:pr-12 lg:pr-24"
      )}>
        <div className="flex flex-col items-center md:items-start w-full">
          {(isMusic || item.category === 'viral_music') && (item.metadata?.spotifyId || item.metadata?.deezerId) && (
            <div className="w-full mb-6 relative z-[60]">
              <MusicPlayerCard
                trackTitle={item.metadata.spotifyTitle || item.metadata.deezerTitle || item.title}
                artistName={item.metadata.spotifyArtist || item.metadata.deezerArtist || ''}
                albumCover={item.metadata.spotifyCover || item.metadata.deezerCover || ''}
                spotifyId={(item.metadata.spotifyId || item.metadata.deezerId) as string}
              />
            </div>
          )}

        {/* Mobile Image Layer (parte baja --> Moved Up) */}
        {showImage && (
          <div className="col-span-full mt-4 mb-2 md:hidden mx-auto w-[90%] flex flex-col items-end vintage-frame vintage-corners transition-all duration-500">
            <img 
              src={item.imageUrl!.includes('wiki') ? `https://wsrv.nl/?url=${item.imageUrl!.replace('https://', '')}&w=800` : item.imageUrl!}
              alt={item.title} 
              loading="lazy" 
              referrerPolicy="no-referrer" 
              crossOrigin="anonymous" 
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.display = 'none'; }} 
              className="w-full h-auto max-h-[35vh] object-cover filter grayscale" 
            />
            <div className="w-full relative mt-3 px-4 h-full flex flex-col pb-4">
              <div className="w-full h-[1px] bg-ink-navy/10 mb-2" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-ink-navy/40 text-right w-full block">{item.imageSource?.replace("Photo by", t("By"))}</span>
            </div>
          </div>
        )}

        <button 
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "group flex items-center gap-3 focus:outline-none transition-all duration-500",
            expanded ? "self-start mb-5 mt-0" : "self-center mt-6 mb-4"
          )}
        >
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
            expanded 
              ? "bg-ink-navy/10 border border-ink-navy/20" 
              : "border-2 group-hover:scale-110",
            !expanded && catColor.border
          )}>
            <span className={cn(
              "transition-all text-sm font-light leading-none",
              expanded ? "text-ink-navy/60" : "text-ink-navy/50"
            )}>
              {expanded ? "×" : "+"}
            </span>
          </div>
          <span className={cn(
            "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] transition-all",
            expanded ? "text-ink-navy/40" : "text-ink-navy/50 group-hover:text-ink-navy/80"
          )}>
            {expanded ? t("CloseContext") : t("ReadContext")}
          </span>
        </button>

        <div className={cn(
          "grid transition-all duration-[800ms] delay-100 ease-[cubic-bezier(0.23,1,0.32,1)] w-full text-left",
          expanded ? "grid-rows-[1fr] opacity-100 mt-0" : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
        )}>
          <div className="overflow-hidden min-h-0">
            <div className="text-sm md:text-base text-ink-navy/85 leading-[1.7] md:leading-[1.75] font-serif space-y-4">
              {item.whyItMatters.split('\n\n').map((paragraph: any, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
