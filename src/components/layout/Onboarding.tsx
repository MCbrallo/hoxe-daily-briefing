"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

export function Onboarding() {
  const [mounted, setMounted] = useState(false);
  const [hasSeen, setHasSeen] = useState(true); // default true to prevent flash
  const [step, setStep] = useState(-1); // -1 is Language Selection
  const { setLanguage, t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem("hoxe_has_onboarded");
    if (!seen) {
      setHasSeen(false);
    }
  }, []);

  if (!mounted || hasSeen) return null;

  const handleLanguageSelect = (lang: "en" | "es" | "gl") => {
    setLanguage(lang);
    setStep(0);
  };

  const slides = [
    { title: t("ObTitle1"), text: t("ObText1") },
    { title: t("ObTitle2"), text: t("ObText2") },
    { title: t("ObTitle3"), text: t("ObText3") },
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem("hoxe_has_onboarded", "true");
      setHasSeen(true);
    }
  };

  // Language Selection Screen
  if (step === -1) {
    return (
      <div className="fixed inset-0 z-[999] bg-mist-white flex flex-col justify-center px-8 py-16 animate-fade-rise">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[400px] h-[400px] rounded-full bg-slate-blue/[0.04] blur-[80px] -top-20 -right-20 animate-[drift_20s_ease-in-out_infinite]" />
        </div>
        
        <div className="relative z-10 max-w-sm mx-auto w-full flex flex-col items-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-navy mb-12">
            <path d="M10 3 H 6a2 2 0 0 0 -2 2 v 14a2 2 0 0 0 2 2 h 12a2 2 0 0 0 2 -2 V 5a2 2 0 0 0 -2 -2 h -4" />
            <path d="M 8 8 L 16 16 M 16 8 L 8 16" />
          </svg>
          
          <h1 className="font-serif text-3xl text-ink-navy mb-2 tracking-tight text-center">{t("SelectLang")}</h1>
          <p className="text-ink-navy/50 text-xs mb-10 text-center">{t("SelectLangDesc")}</p>
          
          <div className="w-full flex flex-col gap-3">
            <button onClick={() => handleLanguageSelect("es")} className="w-full relative overflow-hidden group bg-white border border-ink-navy/5 shadow-sm p-5 rounded-2xl flex items-center justify-between text-left hover:border-ink-navy/20 hover:shadow-md transition-all">
              <div className="flex flex-col relative z-10">
                <span className="font-bold text-ink-navy text-lg leading-none">Español</span>
                <span className="text-[9px] uppercase tracking-widest font-bold text-ink-navy/30 mt-1.5">Castellano</span>
              </div>
              <ChevronRight size={18} className="text-ink-navy/20 group-hover:text-ink-navy group-hover:translate-x-1 transition-all z-10" />
            </button>
            
            <button onClick={() => handleLanguageSelect("en")} className="w-full relative overflow-hidden group bg-white border border-ink-navy/5 shadow-sm p-5 rounded-2xl flex items-center justify-between text-left hover:border-ink-navy/20 hover:shadow-md transition-all">
              <div className="flex flex-col relative z-10">
                <span className="font-bold text-ink-navy text-lg leading-none">English</span>
                <span className="text-[9px] uppercase tracking-widest font-bold text-ink-navy/30 mt-1.5">Global</span>
              </div>
              <ChevronRight size={18} className="text-ink-navy/20 group-hover:text-ink-navy group-hover:translate-x-1 transition-all z-10" />
            </button>

            <button onClick={() => handleLanguageSelect("gl")} className="w-full relative overflow-hidden group bg-white border border-ink-navy/5 shadow-sm p-5 rounded-2xl flex items-center justify-between text-left hover:border-ink-navy/20 hover:shadow-md transition-all">
              <div className="flex flex-col relative z-10">
                <span className="font-bold text-ink-navy text-lg leading-none">Galego</span>
                <span className="text-[9px] uppercase tracking-widest font-bold text-ink-navy/30 mt-1.5">Galicia</span>
              </div>
              <ChevronRight size={18} className="text-ink-navy/20 group-hover:text-ink-navy group-hover:translate-x-1 transition-all z-10" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD ONBOARDING SLIDES
  return (
    <div className="fixed inset-0 z-[999] bg-mist-white flex flex-col justify-between px-8 py-16 animate-fade-rise">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-slate-blue/[0.04] blur-[80px] -top-20 -right-20 animate-[drift_20s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-navy mb-16">
          <path d="M10 3 H 6a2 2 0 0 0 -2 2 v 14a2 2 0 0 0 2 2 h 12a2 2 0 0 0 2 -2 V 5a2 2 0 0 0 -2 -2 h -4" />
          <path d="M 8 8 L 16 16 M 16 8 L 8 16" />
        </svg>

        <div className="min-h-[200px] transition-all duration-500 ease-out">
          <h1 className="font-serif text-4xl text-ink-navy leading-[1.1] tracking-tight mb-4 animate-fade-rise" key={`title-${step}`}>
            {slides[step].title}
          </h1>
          <p className="text-ink-navy/60 text-lg leading-relaxed animate-fade-rise" style={{ animationDelay: "100ms" }} key={`desc-${step}`}>
            {slides[step].text}
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full flex items-center justify-between">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-6 bg-ink-navy" : "w-1.5 bg-ink-navy/20")} />
          ))}
        </div>

        <button 
          onClick={handleNext} 
          className="bg-ink-navy text-mist-white flex items-center gap-2 px-6 py-4 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue hover:scale-105 active:scale-95 transition-all"
        >
          {step === slides.length - 1 ? t("ObEnter") : t("ObNext")}
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
