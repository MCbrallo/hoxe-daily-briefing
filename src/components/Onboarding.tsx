"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function Onboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const hasOnboarded = localStorage.getItem("hoxe_onboarded");
    if (!hasOnboarded) {
      setIsVisible(true);
    }
  }, []);

  if (!mounted) return null;
  if (!isVisible) return null;

  const selectLanguage = (lang: "es" | "en" | "gl") => {
    setLanguage(lang);
    localStorage.setItem("hoxe_onboarded", "true");
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mist-white/95 backdrop-blur-3xl animate-fade-rise">
      <div className="max-w-md w-full px-8 flex flex-col items-center text-center">
        
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3 mb-16">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-navy">
            <path d="M10 3 H 6a2 2 0 0 0 -2 2 v 14a2 2 0 0 0 2 2 h 12a2 2 0 0 0 2 -2 V 5a2 2 0 0 0 -2 -2 h -4" />
            <path d="M 8 8 L 16 16" />
            <path d="M 16 8 L 8 16" />
          </svg>
          <span className="font-bold tracking-[0.4em] text-3xl text-ink-navy uppercase">HOXE</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-ink-navy mb-3 tracking-tight">Choose your language</h1>
        <p className="text-ink-navy/60 text-sm mb-12">Select your preferred context language.</p>

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={() => selectLanguage("es")}
            className="group w-full flex items-center justify-between p-5 rounded-2xl bg-white shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-ink-navy/5 hover:border-ink-navy/20 transition-all font-medium text-ink-navy"
          >
            <div className="flex flex-col items-start">
              <span className="text-lg">Español</span>
              <span className="text-[10px] tracking-widest uppercase text-ink-navy/40 mt-1">Idioma principal</span>
            </div>
            <ChevronRight size={18} className="text-ink-navy/30 group-hover:text-ink-navy group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => selectLanguage("en")}
            className="group w-full flex items-center justify-between p-5 rounded-2xl bg-white shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-ink-navy/5 hover:border-ink-navy/20 transition-all font-medium text-ink-navy"
          >
            <div className="flex flex-col items-start">
              <span className="text-lg">English</span>
              <span className="text-[10px] tracking-widest uppercase text-ink-navy/40 mt-1">Global Context</span>
            </div>
            <ChevronRight size={18} className="text-ink-navy/30 group-hover:text-ink-navy group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => selectLanguage("gl")}
            className="group w-full flex items-center justify-between p-5 rounded-2xl bg-white shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-ink-navy/5 hover:border-ink-navy/20 transition-all font-medium text-ink-navy"
          >
            <div className="flex flex-col items-start">
              <span className="text-lg">Galego</span>
              <span className="text-[10px] tracking-widest uppercase text-ink-navy/40 mt-1">Idioma rexional</span>
            </div>
            <ChevronRight size={18} className="text-ink-navy/30 group-hover:text-ink-navy group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>
    </div>
  );
}
