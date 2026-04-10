"use client";

import { useState, useEffect } from "react";
import { april10Briefing, BriefingItem } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Bookmark, Share } from "lucide-react";
import { cn } from "@/utils/cn";
import { MusicPlayerCard } from "@/components/MusicPlayerCard";
import { useSavedCards } from "@/hooks/useSavedCards";

const CATEGORY_COLORS = [
  { text: "text-[#7F1D1D]", border: "border-[#7F1D1D]" }, // dark red
  { text: "text-[#1E3A8A]", border: "border-[#1E3A8A]" }, // dark blue
  { text: "text-[#14532D]", border: "border-[#14532D]" }, // dark green
  { text: "text-[#701A75]", border: "border-[#701A75]" }, // dark fuchsia
  { text: "text-[#9A3412]", border: "border-[#9A3412]" }, // dark orange
  { text: "text-[#0F766E]", border: "border-[#0F766E]" }, // dark teal
  { text: "text-[#162740]", border: "border-[#162740]" }, // deep slate
];

export default function TodayPage() {
  const briefing = april10Briefing;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hard-lock the document scroll for this pure presentation page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const totalSlides = briefing.items.length + 1; // Cover + Items

  const goNext = () => setCurrentSlide((p) => Math.min(totalSlides - 1, p + 1));
  const goPrev = () => setCurrentSlide((p) => Math.max(0, p - 1));

  // Extract unique categories for the bottom nav bar
  const uniqueCategories = Array.from(new Set(briefing.items.map(item => item.category)));

  const getCategoryColor = (cat: string) => {
    const idx = uniqueCategories.indexOf(cat as any);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  };

  const handleJump = (cat: string) => {
    const firstIndex = briefing.items.findIndex(item => item.category === cat) + 1;
    setCurrentSlide(firstIndex);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-mist-white text-ink-navy font-sans fixed inset-0 z-40 mt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:mt-0 pt-0 md:pt-16">
      
      {/* Decorative Editorial Border */}
      <div className="absolute inset-4 md:inset-8 border border-ink-navy/5 pointer-events-none rounded-xl z-0" />

      {/* Main Slide Deck Container */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center z-10">
        
        {/* Navigation Arrows for content slides */}
        {currentSlide > 0 && (
          <button 
             onClick={goPrev} 
             className="absolute left-1 md:left-8 z-50 p-4 md:p-6 text-ink-navy/30 hover:text-ink-navy transition-colors focus:outline-none"
             aria-label="Previous Slide"
          >
            <ChevronLeft size={36} strokeWidth={1} />
          </button>
        )}
        
        {currentSlide < totalSlides - 1 && currentSlide > 0 && (
          <button 
             onClick={goNext} 
             className="absolute right-1 md:right-8 z-50 p-4 md:p-6 text-ink-navy/30 hover:text-ink-navy transition-colors focus:outline-none"
             aria-label="Next Slide"
          >
            <ChevronRight size={36} strokeWidth={1} />
          </button>
        )}

        {/* --- Slide 0: The Editorial Landing --- */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center px-6 md:px-16 transition-all duration-[1200ms] ease-in-out overflow-hidden",
          currentSlide === 0 ? "opacity-100 translate-y-0 z-50" : "opacity-0 -translate-y-12 pointer-events-none"
        )}>
           {/* Living Background — Ambient Floating Orbs */}
           <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
             <div className="absolute w-[600px] h-[600px] rounded-full bg-atlantic-blue/[0.03] blur-[120px] -top-[200px] -left-[200px] animate-[drift_25s_ease-in-out_infinite]" />
             <div className="absolute w-[500px] h-[500px] rounded-full bg-slate-blue/[0.04] blur-[100px] -bottom-[150px] -right-[150px] animate-[drift_30s_ease-in-out_infinite_reverse]" />
             <div className="absolute w-[350px] h-[350px] rounded-full bg-eucalyptus/[0.03] blur-[80px] top-1/3 right-1/4 animate-[drift_20s_ease-in-out_infinite_0.5s]" />
           </div>

           {/* Desktop: Asymmetric Two-Column Hero */}
           <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center relative z-10">
             
             {/* ── Left Column: Emotional Anchor ── */}
             <div className="md:col-span-6 lg:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
               
              {/* Day of week */}
               <span className="text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-ink-navy/50 animate-fade-rise">
                 {briefing.dayOfWeek}
               </span>
               
               {/* The Date — Massive Emotional Hero with subtle Web-Native Glow Hover */}
               <h1 className="font-serif text-[28vw] md:text-[24vh] lg:text-[28vh] text-ink-navy leading-[0.8] tracking-tighter mt-1 md:mt-2 animate-fade-rise animate-delay-1 hover:text-slate-blue hover:drop-shadow-[0_0_20px_rgba(27,46,75,0.15)] transition-all duration-[1200ms] cursor-default">
                 {briefing.date}
               </h1>

               {/* Tagline — Refined, increased size */}
               <div className="flex flex-col items-center md:items-start mt-12 md:mt-16 animate-fade-rise animate-delay-2 w-full">
                 {/* Editorial connecting line */}
                 <div className="w-10 h-[1px] bg-ink-navy/20 mb-6"></div>
                 <p className="text-xs md:text-sm font-medium tracking-[0.25em] uppercase text-ink-navy/70 overflow-hidden">
                   <span className="inline-block animate-[slideUp_1s_ease-out_0.6s_both]">
                     What defined this day across time and space.
                   </span>
                 </p>
               </div>

               {/* CTA */}
               <button 
                 onClick={goNext}
                 className="mt-8 md:mt-12 group flex items-center gap-3 bg-ink-navy text-mist-white px-8 py-4 text-[11px] font-bold tracking-[0.25em] uppercase hover:bg-slate-blue transition-all duration-300 focus:outline-none animate-fade-rise animate-delay-4"
               >
                 Explore the day
                 <ChevronRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>

             {/* ── Right Column: Product Preview Strip ── */}
             <div className="md:col-span-6 lg:col-span-5 animate-fade-rise animate-delay-3 md:-mt-4 lg:-mt-8">
               <div className="flex flex-col">
                 {uniqueCategories.slice(0, 4).map((cat, i) => {
                   const item = briefing.items.find(it => it.category === cat);
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


        {/* --- Slides 1-N: Categories --- */}
        {briefing.items.map((item, idx) => {
          const slideIndex = idx + 1;
          const isActive = currentSlide === slideIndex;
          
          return (
            <div key={item.id} className={cn(
              "absolute inset-0 w-full h-full flex flex-col px-10 md:px-20 lg:px-28 pt-16 md:pt-[68px] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
              isActive ? "opacity-100 translate-x-0" : 
                currentSlide > slideIndex ? "opacity-0 -translate-x-24 pointer-events-none" : "opacity-0 translate-x-24 pointer-events-none"
            )}>
               <CategorySlideContent item={item} index={idx} isActive={isActive} />
            </div>
          );
        })}

      </div>

      {/* Bottom Category Jump Bar */}
      <div className={cn(
        "absolute bottom-0 w-full pb-4 md:pb-5 z-50 flex justify-center transition-all duration-1000 ease-in-out pt-10 bg-gradient-to-t from-mist-white via-mist-white/80 to-transparent",
        currentSlide > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      )}>
        <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-10 px-6">
           {uniqueCategories.map((catLabel) => {
              // Highlight if the currently viewed sequence belongs to this category cluster
              const currentCategoryName = currentSlide > 0 ? briefing.items[currentSlide - 1].category : '';
              const isActive = currentCategoryName === catLabel;
              const colorObj = getCategoryColor(catLabel);

              return (
                <button 
                  key={catLabel} 
                  onClick={() => handleJump(catLabel)}
                  className={cn(
                    "text-[9px] md:text-[11px] font-bold tracking-[0.25em] uppercase transition-all duration-300 pb-2 border-b-[3px]",
                    isActive ? `${colorObj.text} ${colorObj.border}` : "text-ink-navy/30 border-transparent hover:text-ink-navy/60"
                  )}
                >
                  {catLabel === 'local' ? 'Local Lens' : catLabel}
                </button>
              )
           })}
        </nav>
      </div>

    </div>
  );
}

// Separate component — structurally locked grid
function CategorySlideContent({ item, index, isActive }: { item: BriefingItem; index: number; isActive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { toggleCard, isSaved } = useSavedCards();
  const saved = isSaved(item.id);
  const isMusic = item.category === "music";
  const hasSpotify = isMusic && item.metadata?.spotifyTrackId;

  // Use the same custom color palette for the top eyebrow on active slides
  // We need to recompute the unique categories here or pass the color down.
  // Actually, we can just compute it locally for simplicity.
  const allCategories = Array.from(new Set(april10Briefing.items.map(it => it.category)));
  const catColor = CATEGORY_COLORS[allCategories.indexOf(item.category) % CATEGORY_COLORS.length];

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => setExpanded(false), 300);
    }
  }, [isActive]);

  return (
    <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 h-full" style={{ gridTemplateRows: 'auto auto 1fr' }}>
      
      {/* Row 1: Eyebrow — full width */}
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

      {/* Row 2: Title (left) */}
      <div className={cn("col-span-full self-start", hasSpotify ? "md:col-span-7" : "")}>
        <h2 className={cn(
          "font-serif text-ink-navy leading-[1.05] tracking-tight transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] origin-left",
          expanded ? "text-2xl md:text-3xl" : "text-[2rem] md:text-[3rem]"
        )}>
          {item.title}
        </h2>
      </div>

      {hasSpotify && (
        <div className="col-span-full md:col-span-5 md:row-span-2 md:col-start-8 md:row-start-2 mb-4 md:mb-0 pt-2 z-10 hidden md:block">
          <MusicPlayerCard
            title={item.title}
            artist={item.metadata!.artist || "Unknown Artist"}
            spotifyTrackId={item.metadata!.spotifyTrackId!}
          />
        </div>
      )}

      {/* Row 3: Content */}
      <div className={cn(
        "col-span-full gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-16 md:pb-14 items-start",
        hasSpotify ? "md:col-span-7" : "grid grid-cols-1"
      )}>
        {/* Text column */}
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
        {/* Read Context */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-2.5 mb-3 text-ink-navy hover:text-slate-blue transition-all focus:outline-none"
        >
          <span className="w-5 h-[1px] bg-ink-navy/30 group-hover:bg-slate-blue group-hover:w-7 transition-all" />
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
            {expanded ? "Close Context" : "Read Context"}
          </span>
        </button>

        {/* Short Summary */}
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

        {/* Long Context */}
        <div className={cn(
          "grid transition-all duration-[800ms] delay-100 ease-[cubic-bezier(0.23,1,0.32,1)]",
          expanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
        )}>
          <div className="overflow-hidden min-h-0">
            <div className="text-sm md:text-base text-ink-navy/85 leading-[1.7] md:leading-[1.75] font-serif space-y-4 text-justify">
              {item.whyItMatters.split('\n\n').map((paragraph, i) => (
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
