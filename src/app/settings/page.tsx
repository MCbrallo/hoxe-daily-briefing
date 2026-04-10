"use client";

import { Bell, Shield, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 md:px-12 bg-mist-white max-w-4xl mx-auto">
      {/* Compact Header */}
      <header className="mb-8 border-b border-ink-navy/15 pb-5">
        <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight">{t("Settings")}</h1>
        <p className="font-serif italic text-base text-ink-navy/50 mt-1">Configure your daily context.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        
        {/* Left: Primary */}
        <div className="md:col-span-7 flex flex-col gap-8">
          
          {/* Language */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/35 mb-4 flex items-center gap-2.5">
              <Languages size={13} /> Language
            </h2>
            <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6">
              <div className="flex items-center flex-wrap gap-3">
                {[
                  { id: "en", label: "English" },
                  { id: "es", label: "Español" },
                  { id: "gl", label: "Galego" }
                ].map((lang) => (
                  <button 
                    key={lang.id} 
                    onClick={() => setLanguage(lang.id as any)}
                    className={cn(
                      "text-xs font-bold tracking-widest uppercase px-4 py-2 transition-colors border",
                      language === lang.id 
                        ? "bg-ink-navy text-mist-white border-ink-navy" 
                        : "text-ink-navy/40 hover:text-ink-navy border-ink-navy/10 hover:border-ink-navy/30"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right: Secondary */}
        <div className="md:col-span-5 flex flex-col gap-8">
          {/* Notifications */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/35 mb-4 flex items-center gap-2.5">
              <Bell size={13} /> Communications
            </h2>
            <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6 flex items-center justify-between">
              <div className="pr-4">
                <span className="text-xs font-bold text-ink-navy tracking-widest uppercase block mb-0.5">09:00 Briefing</span>
                <p className="text-[11px] text-ink-navy/50 font-serif italic">Daily email preview.</p>
              </div>
              <button className="w-11 h-[22px] bg-slate-blue rounded-full relative shrink-0 transition-colors">
                <div className="absolute right-[3px] top-[3px] w-4 h-4 rounded-full bg-mist-white shadow-sm"></div>
              </button>
            </div>
          </section>
          
          {/* Application */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-navy/35 mb-4 flex items-center gap-2.5">
              <Shield size={13} /> Application
            </h2>
            <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6 flex flex-col gap-4">
              <button className="text-left text-[10px] font-bold uppercase tracking-widest text-ink-navy/50 hover:text-ink-navy transition-colors">
                Privacy Policy
              </button>
              <div className="w-full h-[1px] bg-ink-navy/8"></div>
              <button className="text-left text-[10px] font-bold uppercase tracking-widest text-red-900/50 hover:text-red-900 transition-colors">
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
