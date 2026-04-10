"use client";

import { ArrowRight, User, Bookmark, Clock } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6 md:px-12 bg-mist-white max-w-4xl mx-auto">
      {/* Compact Header */}
      <header className="mb-8 border-b border-ink-navy/15 pb-5">
        <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight">Profile</h1>
        <p className="font-serif italic text-base text-ink-navy/50 mt-1">Manage your identity and preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

        {/* Left: Auth Card */}
        <div className="md:col-span-7">
          <div className="border border-ink-navy/10 bg-warm-white/20 p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border border-ink-navy/15 bg-warm-white/40 flex items-center justify-center mb-5">
              <User size={26} className="text-ink-navy/30" />
            </div>
            <p className="text-ink-navy/60 text-sm font-serif italic mb-6 max-w-xs leading-relaxed">
              Sync your preferences and maintain your saved collection across devices.
            </p>
            <button className="w-full max-w-xs bg-ink-navy text-mist-white px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue transition-colors focus:outline-none flex justify-center items-center gap-2.5">
              Sign In <ArrowRight size={14} />
            </button>
            <p className="text-[9px] uppercase text-ink-navy/30 mt-4 tracking-widest">
              Authentication deactivated for testing.
            </p>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ink-navy/5 flex items-center justify-center shrink-0">
              <Bookmark size={16} className="text-ink-navy/40" />
            </div>
            <div>
              <span className="text-2xl font-serif text-ink-navy">3</span>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/35">Saved Contexts</p>
            </div>
          </div>

          <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ink-navy/5 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-ink-navy/40" />
            </div>
            <div>
              <span className="text-2xl font-serif text-ink-navy">6</span>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/35">Days Explored</p>
            </div>
          </div>

          <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-navy/35 block mb-2">Preferred Region</span>
            <span className="text-base font-serif text-ink-navy">Spain</span>
          </div>
        </div>

      </div>
    </div>
  );
}
