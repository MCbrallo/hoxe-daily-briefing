"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [briefings, setBriefings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBriefings() {
      const { data, error } = await supabase
        .from('daily_briefings')
        .select(`id, date, created_at, day_of_week`)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setBriefings(data);
      }
    }
    fetchBriefings();
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-mist-white text-ink-navy p-8 md:p-16 font-sans">
      <h1 className="text-3xl font-serif mb-2">HOXE Administrative Preview</h1>
      <p className="text-sm opacity-60 mb-10 max-w-xl">
        Select a pre-generated briefing run from the list below to preview it dynamically. Pre-generated futures will automatically become active on their live dates.
      </p>

      <div className="flex flex-col gap-4">
        {briefings.map((b) => (
          <a
            key={b.id}
            href={`/?date=${encodeURIComponent(b.date)}`}
            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 border border-ink-navy/10 bg-warm-white hover:border-slate-blue transition-all w-full max-w-2xl"
          >
            <div>
               <h2 className="text-xl font-serif group-hover:text-slate-blue transition-colors">{b.date}</h2>
               <p className="text-xs uppercase tracking-widest opacity-40 mt-1">{b.day_of_week}</p>
            </div>
            <div className="mt-4 md:mt-0 opacity-50 group-hover:opacity-100 group-hover:text-slate-blue transition-opacity">
               <span className="text-xs font-bold uppercase tracking-widest border px-4 py-2 border-ink-navy/20 group-hover:border-slate-blue/40 rounded">Preview &rarr;</span>
            </div>
          </a>
        ))}

        {briefings.length === 0 && (
          <p className="opacity-50 italic">No runs available yet.</p>
        )}
      </div>
    </div>
  );
}
