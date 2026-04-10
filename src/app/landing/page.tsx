"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function LandingPage() {
  
  // Hard-lock the document scroll strictly for the landing page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    
    // Cleanup function to unlock scroll when leaving the landing page
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-mist-white text-ink-navy font-sans fixed inset-0 z-[100]">
      
      {/* Decorative Editorial Border */}
      <div className="absolute inset-4 md:inset-8 border-2 border-ink-navy/10 pointer-events-none rounded-sm" />

      {/* Language Header / Absolute Navigation */}
      <div className="absolute top-8 md:top-12 left-0 w-full px-10 md:px-16 flex justify-between items-center z-10">
         <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-ink-navy/50">
           Editorial Edition
         </div>
         <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs font-bold tracking-widest text-ink-navy/40">
           <button className="text-ink-navy underline underline-offset-4 decoration-2">EN</button>
           <button className="hover:text-ink-navy transition-colors">ES</button>
           <button className="hover:text-ink-navy transition-colors">GL</button>
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 w-full h-full max-h-full">
        
        {/* Large Logo Graphic */}
        <div className="mb-8 md:mb-14 opacity-95 flex flex-col items-center gap-4 md:gap-6">
           <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-navy md:w-[140px] md:h-[140px]">
             <path d="M 40 10 L 20 10 C 14 10 10 14 10 20 L 10 80 C 10 86 14 90 20 90 L 80 90 C 86 90 90 86 90 80 L 90 20 C 90 14 86 10 80 10 L 60 10" />
             <path d="M 32 32 L 68 68 M 68 32 L 32 68" strokeWidth="6" />
           </svg>
           <h1 className="font-sans font-extrabold text-4xl md:text-[4rem] tracking-[0.2em] uppercase mt-2 text-ink-navy">
             HOXE
          </h1>
        </div>

        <h2 className="text-2xl md:text-5xl font-serif text-ink-navy max-w-3xl leading-[1.3] italic mb-12 md:mb-16 px-4">
          Travel through time and <br className="hidden md:block"/> see what happened today, years ago.
        </h2>
        
        <Link 
          href="/" 
          className="bg-ink-navy text-mist-white px-10 md:px-12 py-4 md:py-5 rounded-none text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase hover:bg-slate-blue transition-colors flex items-center justify-center shadow-2xl shadow-ink-navy/20 active:scale-95 transform duration-200"
        >
          Open Today
        </Link>

      </div>
    </div>
  );
}
