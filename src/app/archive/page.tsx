"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Archive as ArchiveIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

interface ArchiveEntry {
  date: string;
  year: string;
  summary: string;
  available: boolean;
}

export default function ArchivePage() {
  const { t } = useLanguage();
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    async function load() {
      const { data: records } = await supabase
        .from("daily_briefings")
        .select("date, created_at, day_of_week, briefing_items(title)")
        .order("created_at", { ascending: false })
        .limit(30);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const pastRecords = (records || []).filter(r => {
        const year = new Date(r.created_at).getFullYear();
        const parsedDate = new Date(`${r.date}, ${year}`);
        return parsedDate.getTime() < todayStart.getTime();
      });

      const mapped = pastRecords.slice(0, 10).map(r => {
        const titles = r.briefing_items?.filter((bi: any) => bi.title).map((bi: any) => bi.title.split(' - ')[0]) || [];
        const summary = titles.slice(0, 3).join(" • ") + (titles.length > 3 ? "..." : "");
        const dateObj = new Date(r.created_at);
        return {
          date: r.date,
          year: dateObj.getFullYear().toString(),
          summary: summary || t("ArchiveFullBriefing"),
          available: true
        };
      });

      setArchives(mapped);
      setLoading(false);
    }
    load();
  }, [t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-white">
        <div className="w-6 h-6 border-t-2 border-ink-navy/30 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-mist-white text-ink-navy font-sans pt-16 md:pt-20 pb-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto w-full">
        {/* Compact Header */}
        <header className="mb-8 flex items-end justify-between border-b border-ink-navy/15 pb-5">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight">{t("ArchiveTitle")}</h1>
            <p className="font-serif italic text-base text-ink-navy/50 mt-1">{t("ArchiveSubtitle")}</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-navy bg-ink-navy/5 px-4 py-1.5 rounded-full">
            {currentYear}
          </span>
        </header>

        {/* Premium List Modules */}
        <div className="flex flex-col gap-4">
          {archives.length === 0 && (
            <div className="rounded-[20px] border border-ink-navy/8 bg-ink-navy/[0.02] p-10 text-center">
              <ArchiveIcon size={24} className="mx-auto text-ink-navy/10 mb-3" />
              <p className="text-sm text-ink-navy/25 font-serif italic">{t("EndOfArchive")}</p>
            </div>
          )}
          {archives.map((day, i) => (
            <div key={i} className="group relative animate-fade-rise" style={{ animationDelay: `${i * 60}ms` }}>
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
            </div>
          ))}
        </div>

        {/* End of Archive indicator */}
        {archives.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="w-8 h-[1px] bg-ink-navy/15" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-ink-navy/20">
              {t("EndOfArchive")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
