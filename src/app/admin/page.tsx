"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Eye, LayoutDashboard, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

function AdminDashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params?.get("key");
  
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (key !== "hoxe2026") {
      alert("Unauthorized Access Cipher");
      router.push("/profile");
      return;
    }

    async function load() {
      const { data, error } = await supabase
        .from("daily_briefings")
        .select(`
          id, date, created_at, day_of_week,
          briefing_items ( id )
        `);

      if (data) {
        // Chronological sort using JS to ascending (older first)
        const sortedDays = data.sort((a, b) => {
          const dateA = new Date(`${a.date} 2026`).getTime();
          const dateB = new Date(`${b.date} 2026`).getTime();
          return dateA - dateB;
        });
        setDays(sortedDays);
      }
      setLoading(false);
    }
    load();
  }, [key, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mist-white flex flex-col gap-4 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-blue border-t-transparent animate-spin" />
        <span className="text-ink-navy/40 font-bold uppercase tracking-[0.2em] text-[10px]">Restoring Secure Protocol...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-white pt-12 pb-32 px-6 md:px-12 font-sans selection:bg-slate-blue/20 selection:text-ink-navy relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-slate-blue/5 rounded-full blur-[140px] pointer-events-none mix-blend-multiply" />
      
      <header className="flex flex-col md:flex-row gap-6 md:gap-0 justify-between items-start md:items-end mb-14 max-w-4xl mx-auto pb-8 relative z-10 border-b border-ink-navy/10">
        <div className="flex flex-col items-start gap-4">
          <Link href="/profile" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 hover:text-ink-navy transition-colors">
            <ArrowLeft size={14} strokeWidth={2} /> Return to Access
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-5xl text-ink-navy tracking-tight flex items-center gap-4 mb-2">
              <LayoutDashboard size={32} className="text-slate-blue" strokeWidth={1.5} />
              Editorial Admin
            </h1>
            <p className="text-sm font-serif italic text-ink-navy/50">High-level overview and QA access for daily publications.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-white/80 backdrop-blur-md border border-ink-navy/10 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-slate-blue animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy">System Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-4 relative z-10">
        <div className="px-2 mb-2 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-ink-navy/30">
          <span>Active Registry</span>
          <span>{days.length} Publications</span>
        </div>

        {days.map((day, i) => (
          <div 
            key={day.id} 
            className="group bg-white/70 backdrop-blur-xl rounded-[24px] p-5 md:p-6 shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white/50 hover:border-ink-navy/10 hover:shadow-[0_8px_30px_-5px_rgba(27,46,75,0.1)] transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-rise"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-ink-navy/5 shadow-sm flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold uppercase tracking-widest text-ink-navy/30 mb-0.5">Vol</span>
                <span className="font-serif text-xl text-ink-navy leading-none">{i + 1}</span>
              </div>
              
              <div className="flex flex-col">
                <h2 className="text-2xl md:text-3xl font-serif text-ink-navy tracking-tight">{day.date}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/40">{day.day_of_week}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-blue/60" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-blue">{day.briefing_items.length} Modules</span>
                </div>
              </div>
            </div>
            
            <Link 
              href={`/?date=${encodeURIComponent(day.date)}`}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-mist-white hover:bg-slate-blue hover:text-mist-white border border-ink-navy/10 text-ink-navy px-6 py-3.5 md:py-3 rounded-[16px] text-[10px] font-bold uppercase tracking-[0.2em] hover:shadow-lg transition-all outline-none"
            >
              <Eye size={14} />
              Preview Entry
            </Link>
          </div>
        ))}

        {days.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-ink-navy/10 rounded-[32px] p-16 flex flex-col items-center text-center mt-4">
            <LayoutDashboard size={32} className="text-ink-navy/20 mb-4" strokeWidth={1} />
            <h3 className="font-serif text-xl text-ink-navy mb-2">No Active Records</h3>
            <p className="text-sm font-medium text-ink-navy/40">Run the secure import protocols to populate the editorial database.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-mist-white flex flex-col gap-4 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-blue border-t-transparent animate-spin" />
        <span className="text-ink-navy/40 font-bold uppercase tracking-[0.2em] text-[10px]">Verifying Encryption...</span>
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}
