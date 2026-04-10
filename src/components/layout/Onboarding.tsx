"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function Onboarding() {
  const [mounted, setMounted] = useState(false);
  const [hasSeen, setHasSeen] = useState(true); // default true to prevent flash
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem("hoxe_has_onboarded");
    if (!seen) {
      setHasSeen(false);
    }
  }, []);

  if (!mounted || hasSeen) return null;

  const slides = [
    {
      title: "The context of today.",
      text: "Every morning, HOXE resurfaces the exact events that shook the world on this specific date in history.",
    },
    {
      title: "Curate your feed.",
      text: "Turn off warfare, boost science, or mute history. From Settings you completely govern your editorial focus.",
    },
    {
      title: "Pulse of the internet.",
      text: "The Viral Tab distills the definitive cultural moments, breaking records, and scandals of the day into a swipeable deck.",
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem("hoxe_has_onboarded", "true");
      setHasSeen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-mist-white flex flex-col justify-between px-8 py-16">
      
      {/* Decorative background blur */}
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
          className="bg-ink-navy text-mist-white flex items-center gap-2 px-6 py-4 rounded-full text-xs font-bold tracking-[0.2em] uppercase hover:bg-slate-blue hover:scale-105 active:scale-95 transition-all"
        >
          {step === slides.length - 1 ? "ENTER HOXE" : "NEXT"}
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
