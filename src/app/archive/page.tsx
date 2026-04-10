import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/utils/cn";

import { supabase } from "@/lib/supabase";

export const revalidate = 60; // Cash for a minute

export default async function ArchivePage() {
  const { data: records } = await supabase
    .from("daily_briefings")
    .select("date, created_at, day_of_week, briefing_items(title)")
    .order("created_at", { ascending: false })
    .limit(30);

  const archives = (records || []).map(r => {
    const titles = r.briefing_items?.filter((bi: any) => bi.title).map((bi: any) => bi.title.split(' - ')[0]) || [];
    const summary = titles.slice(0, 3).join(" • ") + (titles.length > 3 ? "..." : "");
    const dateObj = new Date(r.created_at);
    return {
      date: r.date,
      year: dateObj.getFullYear().toString(),
      summary: summary || "Full briefing available",
      available: true
    };
  });

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-mist-white text-ink-navy font-sans pt-16 md:pt-20 pb-24 px-6 md:px-12 lg:px-24">
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

        {/* Premium List Modules */}
        <div className="flex flex-col gap-4">
          {archives.map((day, i) => (
            <div key={i} className="group relative">
              {day.available ? (
                <Link href={`/?date=${encodeURIComponent(day.date)}`} className="flex items-center p-5 md:p-6 bg-white/70 backdrop-blur-md rounded-[24px] shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white/50 hover:border-ink-navy/10 hover:shadow-[0_8px_30px_-5px_rgba(27,46,75,0.1)] transition-all duration-300">
                  <div className="flex flex-col w-[90px] md:w-[110px] shrink-0">
                    <span className="text-xl md:text-2xl font-serif text-ink-navy leading-none">{day.date}</span>
                    <span className="text-[9px] font-bold tracking-[0.2em] text-ink-navy/30 mt-1">{day.year}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-ink-navy/10 mx-2 md:mx-4 hidden md:block"></div>
                  <span className="flex-1 text-ink-navy/80 text-sm md:text-base font-medium leading-snug pl-4 md:pl-0 line-clamp-2 md:line-clamp-1">{day.summary}</span>
                  <div className="bg-ink-navy text-mist-white p-2 rounded-full opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 shrink-0 ml-4 hidden md:block">
                    <ArrowRight size={16} />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center p-5 md:p-6 bg-transparent border border-ink-navy/5 rounded-[24px] opacity-60">
                  <div className="flex flex-col w-[90px] md:w-[110px] shrink-0">
                    <span className="text-xl md:text-2xl font-serif text-ink-navy/40 leading-none">{day.date}</span>
                    <span className="text-[9px] font-bold tracking-[0.2em] text-ink-navy/20 mt-1">{day.year}</span>
                  </div>
                  <span className="flex-1 text-ink-navy/30 text-sm md:text-base font-medium italic pl-4 md:pl-0">{day.summary}</span>
                  <div className="bg-ink-navy/5 text-ink-navy/30 p-2 rounded-full shrink-0 ml-4">
                    <Lock size={16} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Load More */}
        <div className="mt-12 flex justify-center">
          <button className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink-navy/40 hover:text-ink-navy hover:bg-white hover:shadow-xl px-10 py-4 rounded-full transition-all focus:outline-none cursor-not-allowed">
            Load Previous Months
          </button>
        </div>
      </div>
    </div>
  );
}
