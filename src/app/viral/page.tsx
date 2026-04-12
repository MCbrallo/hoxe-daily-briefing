"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Flame, Film, Smartphone, Trophy, Brain, ChevronRight, Check, X, ArrowLeft } from "lucide-react";
import { cn } from "@/utils/cn";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

interface ViralItem {
  id: string;
  category: string;
  title: string;
  year: string;
  short_explanation: string;
  why_it_matters: string;
  image_url: string | null;
  image_source: string | null;
  metadata_spotify_track_id: string | null; // Note: now actually holds YT id
}

const VIRAL_META: Record<string, { icon: any; label: string; dotColor: string; }> = {
  viral_music:   { icon: Music,      label: "Nº1 DEL DÍA",     dotColor: "bg-violet-500" },
  viral_scandal: { icon: Flame,      label: "EL ESCÁNDALO",     dotColor: "bg-rose-500" },
  viral_movie:   { icon: Film,       label: "ESTRENO DEL DÍA",  dotColor: "bg-amber-500" },
  viral_moment:  { icon: Smartphone, label: "MOMENTO VIRAL",    dotColor: "bg-sky-500" },
  viral_record:  { icon: Trophy,     label: "RÉCORD ROTO",      dotColor: "bg-emerald-500" },
};
const FALLBACK_META = VIRAL_META.viral_music;

function SwipeStack({ items, onComplete }: { items: ViralItem[]; onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startRef = useRef({ y: 0, time: 0 });
  const THRESHOLD = 65;

  const handleStart = useCallback((cy: number) => {
    if (isExiting) return;
    startRef.current = { y: cy, time: Date.now() };
    setIsDragging(true);
  }, [isExiting]);

  const handleMove = useCallback((cy: number) => {
    if (!isDragging || isExiting) return;
    const dy = cy - startRef.current.y;
    // Disallow swiping completely down if at first item
    if (current === 0 && dy > 0) {
      setDragY(dy * 0.2); // Rubber band effect
      return;
    }
    setDragY(dy);
  }, [isDragging, isExiting, current]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);
    const vel = Math.abs(dragY) / Math.max(1, Date.now() - startRef.current.time) * 1000;
    
    if (Math.abs(dragY) > THRESHOLD || vel > 500) {
      const dir = dragY > 0 ? 1 : -1;
      // Down = back, Up = forward (like TikTok)
      if (dir === 1 && current > 0) {
        setIsExiting(true); setDragY(window.innerHeight);
        setTimeout(() => { setCurrent(c => c - 1); setDragY(0); setIsExiting(false); }, 250);
      } else if (dir === -1) {
        if (current >= items.length - 1) { onComplete(); return; }
        setIsExiting(true); setDragY(-window.innerHeight);
        setTimeout(() => { setCurrent(c => c + 1); setDragY(0); setIsExiting(false); }, 250);
      } else { setDragY(0); }
    } else { setDragY(0); }
  }, [isDragging, isExiting, dragY, current, items.length, onComplete]);

  const onTS = (e: React.TouchEvent) => handleStart(e.touches[0].clientY);
  const onTM = (e: React.TouchEvent) => handleMove(e.touches[0].clientY);
  const onTE = () => handleEnd();
  const onMD = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientY); };
  const onMM = (e: React.MouseEvent) => handleMove(e.clientY);
  const onMU = () => handleEnd();
  const onML = () => { if (isDragging) handleEnd(); };

  const item = items[current];
  if (!item) return null;
  
  const meta = VIRAL_META[item.category] || FALLBACK_META;
  const Icon = meta.icon;

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden touch-none"
         onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
         onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onML}>
      
      {/* Background Image Full Bleed */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full",
          !isDragging && !isExiting && "transition-transform duration-300 ease-out",
          isExiting && "transition-transform duration-250 ease-in"
        )}
        style={{ transform: `translateY(${dragY}px)` }}
      >
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-950 via-purple-900 to-black" />
        )}
        
        {/* Dynamic dark gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent h-3/4 bottom-0 top-auto pointer-events-none" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 md:p-12 pointer-events-none">
          
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <Icon className="text-white" size={20} strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold tracking-[0.3em] text-white uppercase drop-shadow-md">{meta.label}</span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl text-white leading-[1.05] drop-shadow-lg tracking-tight mb-2">
              {item.title}
            </h1>
            
            <p className="text-white/80 text-lg md:text-xl leading-relaxed drop-shadow-md mb-2 max-w-xl">
              {item.short_explanation}
            </p>
            
            {item.year && item.year !== "Unknown" && (
              <span className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-white/10 font-serif absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 blur-[2px] opacity-30 select-none pointer-events-none">
                {item.year}
              </span>
            )}
          </div>
        </div>

        {/* Spotify embed for viral_music */}
        {item.category === 'viral_music' && item.metadata_spotify_track_id && (() => {
          try {
            const meta = typeof item.metadata_spotify_track_id === 'string'
              ? JSON.parse(item.metadata_spotify_track_id)
              : item.metadata_spotify_track_id;
            if (!meta.spotifyId) return null;
            return (
              <div className="absolute bottom-6 left-6 right-6 md:left-12 md:right-12 z-50 animate-fade-rise max-w-2xl mx-auto pointer-events-auto">
                <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50" style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${meta.spotifyId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: "0", borderRadius: "12px", pointerEvents: "auto" }}
                  />
                </div>
              </div>
            );
          } catch { return null; }
        })()}
      </div>

      {/* Persistent UI overlays mapping progress */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {items.map((_, i) => (
          <div key={i} className={cn(
            "w-1.5 rounded-full transition-all duration-300 shadow-md",
            i === current ? cn("h-6 bg-white") : "h-1.5 bg-white/30"
          )} />
        ))}
      </div>
      
      {/* Return back arrow */}
      <Link href="/" className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-colors z-[100]">
        <ArrowLeft size={20} />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────

export default function ViralPage() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const targetDate = params.get('date');
      const todayStr = targetDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
      
      let finalRows = null;
      const { data: rows } = await supabase.from("daily_briefings").select("*, briefing_items (*)").eq("date", todayStr).limit(1);
      
      if (rows && rows.length > 0) {
        finalRows = rows[0];
      } else {
        const { data: fallbackRows } = await supabase.from('daily_briefings').select("*, briefing_items (*)").order('created_at', { ascending: true }).limit(1);
        if (fallbackRows && fallbackRows.length > 0) finalRows = fallbackRows[0];
      }

      if (finalRows && finalRows.briefing_items) {
        const viral = finalRows.briefing_items
          .filter((i: any) => i.category.startsWith("viral_"))
          .map((i: any) => ({
            ...i,
            title: (language === 'es' ? i.title_es : language === 'gl' ? i.title_gl : null) || i.title,
            short_explanation: (language === 'es' ? i.short_explanation_es : language === 'gl' ? i.short_explanation_gl : null) || i.short_explanation,
            why_it_matters: (language === 'es' ? i.why_it_matters_es : language === 'gl' ? i.why_it_matters_gl : null) || i.why_it_matters,
          }));
        setItems(viral);
      }
      setLoading(false);
    }
    load();
  }, [language]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-t-2 border-white/50 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      {!showQuiz && items.length > 0 ? (
        <SwipeStack items={items} onComplete={() => setShowQuiz(true)} />
      ) : showQuiz ? (
        <div className="flex-1 flex items-center justify-center p-6 fade-in">
           <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 text-center text-white relative shadow-2xl">
              <Trophy size={48} className="mx-auto text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl mb-2">¡Completado!</h2>
              <p className="text-white/60 text-sm mb-8">Has visto todo el contenido viral del día.</p>
              <Link href="/" className="w-full block bg-white text-black py-4 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-colors">Volver a Lector</Link>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
            <Flame size={24} className="text-white/20 animate-pulse" />
        </div>
      )}
    </div>
  );
}
