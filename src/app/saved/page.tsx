"use client";

import { useSavedCards } from "@/hooks/useSavedCards";
import { BookmarkMinus, Compass } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

const CATEGORY_COLORS = [
  { text: "text-[#7F1D1D]", border: "border-[#7F1D1D]" },
  { text: "text-[#1E3A8A]", border: "border-[#1E3A8A]" },
  { text: "text-[#14532D]", border: "border-[#14532D]" },
  { text: "text-[#701A75]", border: "border-[#701A75]" },
  { text: "text-[#9A3412]", border: "border-[#9A3412]" },
  { text: "text-[#0F766E]", border: "border-[#0F766E]" },
  { text: "text-[#162740]", border: "border-[#162740]" },
];

export default function SavedPage() {
  const { savedCards, removeCard } = useSavedCards();

  const getCategoryColor = (cat: string) => {
    const charCode = cat.charCodeAt(0) + cat.charCodeAt(cat.length - 1);
    return CATEGORY_COLORS[charCode % CATEGORY_COLORS.length];
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-mist-white text-ink-navy font-sans pt-16 md:pt-20 pb-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto w-full">
        
        <header className="mb-12 md:mb-16 border-b border-ink-navy/10 pb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight mb-3">Saved Briefings</h1>
          <p className="text-sm md:text-base font-medium tracking-widest uppercase text-ink-navy/40">
            {savedCards.length} {savedCards.length === 1 ? 'Entry' : 'Entries'} Archived
          </p>
        </header>

        {savedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-rise">
            <div className="w-16 h-16 rounded-full bg-ink-navy/5 flex items-center justify-center mb-6">
              <BookmarkMinus size={24} className="text-ink-navy/20" />
            </div>
            <h2 className="font-serif text-2xl text-ink-navy/60 mb-4">No editions saved yet</h2>
            <p className="text-ink-navy/40 max-w-md mx-auto mb-8">
              Articles and briefings you save will appear here for future reference. Return to today's edition to begin collecting.
            </p>
            <Link 
              href="/"
              className="flex items-center gap-2 bg-ink-navy text-mist-white px-6 py-3 text-[11px] font-bold tracking-[0.25em] uppercase hover:bg-slate-blue transition-all"
            >
              <Compass size={14} />
              Read Today
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {savedCards.map((item) => {
              const catLabel = item.category === "local" ? "Local Lens" : item.category.charAt(0).toUpperCase() + item.category.slice(1);
              const colorObj = getCategoryColor(item.category);

              return (
                <div key={item.id} className="group relative bg-white/70 backdrop-blur-md rounded-[28px] border border-white shadow-[0_8px_30px_-5px_rgba(27,46,75,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(27,46,75,0.1)] hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col">
                  {/* Subtle Top Gradient Bar */}
                  <div className={cn("absolute top-0 left-0 w-full h-1", colorObj.text.replace('text-', 'bg-'))} />
                  
                  <div className="p-8 flex flex-col flex-1 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className={cn("text-[9px] font-bold tracking-[0.25em] uppercase px-3 py-1 bg-white rounded-full border border-ink-navy/5 shadow-sm", colorObj.text)}>
                          {catLabel}
                        </span>
                        {item.year && (
                          <span className="text-[10px] font-serif italic text-ink-navy/40">{item.year}</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => removeCard(item.id)}
                        className="w-8 h-8 rounded-full bg-ink-navy/5 flex items-center justify-center text-ink-navy/30 hover:bg-red-50 hover:text-red-500 transition-colors focus:outline-none"
                        title="Remove Bookmark"
                      >
                        <BookmarkMinus size={14} strokeWidth={2} />
                      </button>
                    </div>

                    <h3 className="text-xl md:text-2xl font-serif text-ink-navy leading-snug mb-4">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm font-sans text-ink-navy/60 leading-relaxed [hyphens:none] line-clamp-4 flex-1">
                      {item.shortExplanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
