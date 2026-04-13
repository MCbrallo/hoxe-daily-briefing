"use client";

import { useRef, useState } from "react";
import { ArrowRight, Settings2, Languages, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const { language, setLanguage, disabledCategories, toggleCategory, t } = useLanguage();
  const clickTracker = useRef(0);
  const [showCipher, setShowCipher] = useState(false);

  const EDITORIAL_CATS = [
    "history", "science", "physics", "biology and medicine", "technology", "environment", 
    "warfare", "politics", "law", "business", 
    "culture", "music", "film and television", "art and architecture", 
    "literature", "philosophy", "religion", 
    "sports", "exploration", "people"
  ];
  const handleHeaderClick = () => {
    clickTracker.current += 1;
    if (clickTracker.current >= 7) { 
      clickTracker.current = 0;
      setShowCipher(true);
    }
  };

  const handleCipherSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = fd.get("cipher") as string;
    if (p) {
      window.location.href = `/admin?key=${encodeURIComponent(p)}`;
    }
  };

  return (
    <div className="min-h-screen pt-12 md:pt-16 pb-20 px-4 md:px-12 bg-mist-white selection:bg-slate-blue/20 selection:text-ink-navy relative overflow-hidden flex flex-col items-center">
      
      {/* NATIVE CIPHER MODAL (Bypasses Browser Popup Blockers) */}
      {showCipher && (
        <div className="fixed inset-0 z-[999] bg-mist-white/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white p-10 md:p-14 rounded-[40px] shadow-[0_20px_80px_-20px_rgba(27,46,75,0.15)] max-w-sm md:max-w-md w-full border border-ink-navy/5 relative overflow-hidden flex flex-col items-center text-center animate-fade-rise">
              <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-slate-blue/15 rounded-full blur-[70px] pointer-events-none" />
              
              <button onClick={() => setShowCipher(false)} className="absolute top-6 right-6 text-ink-navy/30 hover:text-ink-navy transition-colors bg-mist-white w-8 h-8 flex items-center justify-center rounded-full">
                <X size={16} />
              </button>
              
              <div className="w-16 h-16 bg-ink-navy/5 border border-ink-navy/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                 <Settings2 size={28} className="text-slate-blue" strokeWidth={1.5} />
              </div>
              
              <h3 className="font-serif text-4xl text-ink-navy tracking-tight leading-none mb-2 relative z-10">Admin Access</h3>
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-ink-navy/30 mb-8 relative z-10">Classified Override Area</p>
              
              <form onSubmit={handleCipherSubmit} className="flex flex-col gap-4 w-full relative z-10">
                <input 
                  type="password" 
                  name="cipher"
                  autoFocus
                  placeholder="Cipher Code..."
                  className="w-full bg-mist-white/50 border border-ink-navy/10 outline-none rounded-2xl px-6 py-4 text-center text-lg md:text-xl font-medium tracking-widest text-ink-navy placeholder:text-ink-navy/20 focus:bg-white focus:border-slate-blue/40 focus:ring-4 focus:ring-slate-blue/10 transition-all"
                />
                <button type="submit" className="w-full bg-ink-navy text-white px-6 py-4 rounded-2xl text-[11px] uppercase tracking-[0.25em] font-bold shadow-xl hover:bg-slate-blue hover:-translate-y-0.5 transition-all">
                  Unlock System
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-warm-white rounded-full blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="w-full max-w-2xl z-10 relative mt-2">

        <header className="mb-6 w-full flex justify-center">
          {/* MASSIVE SECURE CLICK TARGET FOR EASTER EGG */}
          <div 
            onClick={handleHeaderClick} 
            className="flex flex-col items-center cursor-pointer transition-transform active:scale-[0.98] hover:bg-ink-navy/5 p-4 rounded-3xl"
          >
            <Settings2 
              size={24} 
              className="text-ink-navy/60 mb-1" 
              strokeWidth={1.5} 
            />
            
            <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tighter leading-none mb-2 select-none">
              {t("Settings")}
            </h1>
          </div>
        </header>

        <div className="flex flex-col gap-4 w-full">

          {/* CONTENT PREFERENCES */}
          <section className="bg-white/80 backdrop-blur-xl rounded-[20px] border border-ink-navy/10 shadow-[0_4px_20px_-10px_rgba(27,46,75,0.06)] p-5">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 mb-3 flex items-center gap-2 border-b border-ink-navy/10 pb-2">
              Data Filtering Engine
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {EDITORIAL_CATS.map((cat) => {
                const isActive = !disabledCategories.includes(cat);
                return (
                  <button 
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-300 border text-left",
                      isActive 
                        ? "bg-white text-ink-navy border-ink-navy/20 shadow-sm" 
                        : "bg-transparent text-ink-navy/40 border-ink-navy/10 opacity-60"
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase">{cat}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isActive ? "bg-slate-blue/80" : "bg-ink-navy/20 border-transparent")} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* LOCALIZATION & APP */}
          <section className="bg-white/80 backdrop-blur-xl rounded-[20px] border border-ink-navy/10 shadow-[0_4px_20px_-10px_rgba(27,46,75,0.06)] p-5">
            <div>
              <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 mb-3 flex items-center gap-2 border-b border-ink-navy/10 pb-2">
                <Languages size={12} /> Global Language
              </h2>
              <div className="bg-mist-white/50 rounded-xl border border-ink-navy/5 p-1 flex shadow-inner">
                {[
                  { id: "en", label: "English" },
                  { id: "es", label: "Español" },
                  { id: "gl", label: "Galego" }
                ].map((lang) => (
                  <button 
                    key={lang.id} 
                    onClick={() => setLanguage(lang.id as any)}
                    className={cn(
                      "flex-1 py-2.5 text-[9px] font-bold tracking-[0.15em] uppercase transition-all rounded-lg",
                      language === lang.id 
                        ? "bg-white text-ink-navy shadow-sm border border-ink-navy/5 scale-100 z-10" 
                        : "text-ink-navy/40 hover:bg-white/50"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 mb-2 px-1">
                Legal
              </h2>
              <div className="bg-mist-white/50 rounded-xl border border-ink-navy/5 overflow-hidden flex flex-col shadow-inner">
                <button 
                  onClick={() => alert("Hoxe Protocol - Strictly Private")}
                  className="text-left text-[9px] font-bold uppercase tracking-[0.2em] text-ink-navy/60 hover:bg-white/80 transition-colors px-4 py-3 flex items-center justify-between group"
                >
                  Privacy Policy <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform opacity-30" />
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
