import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/utils/cn";

export default function ArchivePage() {
  const archives = [
    { date: "April 10", year: "2026", summary: "Titanic, Zapata, & The Abyss", available: true },
    { date: "April 9", year: "2026", summary: "The Fall of Baghdad & Literary Giants", available: false },
    { date: "April 8", year: "2026", summary: "Solar Eclipses & Renaissance Discoveries", available: false },
    { date: "April 7", year: "2026", summary: "The World Health Organization is Born", available: false },
    { date: "April 6", year: "2026", summary: "The First Modern Olympic Games", available: false },
    { date: "April 5", year: "2026", summary: "Triumph in Mathematics: The Fields Medal", available: false },
    { date: "April 4", year: "2026", summary: "Founding of the UN Space Treaty", available: false },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-mist-white text-ink-navy font-sans pt-24 md:pt-32 pb-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto w-full">
        {/* Compact Header */}
        <header className="mb-8 flex items-end justify-between border-b border-ink-navy/15 pb-5">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight">Archive</h1>
            <p className="font-serif italic text-base text-ink-navy/50 mt-1">An index of past contexts.</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-navy bg-ink-navy/5 px-4 py-1.5 rounded-full">
            2026
          </span>
        </header>

        {/* Condensed List */}
        <ul className="flex flex-col">
          {archives.map((day, i) => (
            <li key={i} className="group border-t border-ink-navy/8">
              {day.available ? (
                <Link href="/" className="flex items-center py-4 md:py-6 gap-4 md:gap-8 hover:bg-warm-white/50 transition-colors px-2 md:-mx-2 md:px-4 rounded-lg">
                  <span className="text-lg md:text-xl font-serif text-ink-navy w-[90px] md:w-[110px] shrink-0">{day.date}</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-ink-navy/25 shrink-0 hidden md:block">{day.year}</span>
                  <span className="flex-1 text-ink-navy/90 text-sm md:text-base font-medium truncate">{day.summary}</span>
                  <span className="text-ink-navy/20 group-hover:text-ink-navy transition-colors shrink-0">
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ) : (
                <div className="flex items-center py-4 md:py-6 gap-4 md:gap-8 px-2 md:-mx-2 md:px-4 opacity-50 cursor-not-allowed">
                  <span className="text-lg md:text-xl font-serif text-ink-navy w-[90px] md:w-[110px] shrink-0">{day.date}</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-ink-navy/25 shrink-0 hidden md:block">{day.year}</span>
                  <span className="flex-1 text-ink-navy/40 text-sm md:text-base font-medium truncate italic">{day.summary}</span>
                  <span className="text-ink-navy/20 shrink-0">
                    <Lock size={14} />
                  </span>
                </div>
              )}
            </li>
          ))}
          <li className="border-t border-ink-navy/8"></li>
        </ul>

        {/* Load More */}
        <div className="mt-10 flex justify-center">
          <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-navy/50 hover:text-ink-navy border border-ink-navy/15 px-7 py-2.5 rounded-full transition-colors focus:outline-none cursor-not-allowed">
            Load Previous Months
          </button>
        </div>
      </div>
    </div>
  );
}
