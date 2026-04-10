"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Flame, Film, Quote, Smartphone, Trophy, Brain, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

interface ViralItem {
  id: string;
  category: string;
  title: string;
  year: string;
  short_explanation: string;
  why_it_matters: string;
  image_url: string | null;
  image_source: string | null;
  metadata_spotify_track_id: string | null;
}

const VIRAL_META: Record<string, { icon: any; label: string; accent: string; gradFrom: string; gradTo: string }> = {
  viral_music:   { icon: Music,      label: "Nº1 del Día",     accent: "text-purple-300",  gradFrom: "from-purple-900/60", gradTo: "to-fuchsia-900/40" },
  viral_scandal: { icon: Flame,      label: "El Escándalo",    accent: "text-red-300",     gradFrom: "from-red-900/60",    gradTo: "to-orange-900/40" },
  viral_movie:   { icon: Film,       label: "Estreno del Día", accent: "text-amber-300",   gradFrom: "from-amber-900/60",  gradTo: "to-yellow-900/40" },
  viral_quote:   { icon: Quote,      label: "In Memoriam",     accent: "text-slate-300",   gradFrom: "from-slate-800/60",  gradTo: "to-zinc-800/40" },
  viral_moment:  { icon: Smartphone, label: "Momento Viral",   accent: "text-sky-300",     gradFrom: "from-sky-900/60",    gradTo: "to-cyan-900/40" },
  viral_record:  { icon: Trophy,     label: "Récord Roto",     accent: "text-emerald-300", gradFrom: "from-emerald-900/60",gradTo: "to-teal-900/40" },
};

interface QuizQuestion { question: string; options: string[]; correctIndex: number; }

function generateQuiz(items: ViralItem[]): QuizQuestion[] {
  const qs: QuizQuestion[] = [];
  for (const item of items.filter(i => i.year && i.year !== "Unknown").slice(0, 4)) {
    const y = parseInt(item.year);
    if (isNaN(y)) continue;
    const opts = [String(y), ...[-12,-5,7,15].map(o=>String(y+o)).filter(s=>s!==String(y)&&parseInt(s)>0)].slice(0,4).sort(()=>0.5-Math.random());
    qs.push({ question: `¿En qué año: "${item.title}"?`, options: opts, correctIndex: opts.indexOf(String(y)) });
  }
  return qs;
}

// ═══════════════════════════════════════════════
// SWIPEABLE CARD STACK
// ═══════════════════════════════════════════════

function SwipeCardStack({ items, onComplete }: { items: ViralItem[]; onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDir, setExitDir] = useState(0);
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (isExiting) return;
    startRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsDragging(true);
  }, [isExiting]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || isExiting) return;
    setDragX(clientX - startRef.current.x);
    setDragY(Math.max(0, (clientY - startRef.current.y) * 0.15)); // subtle vertical drag
  }, [isDragging, isExiting]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);

    const velocity = Math.abs(dragX) / Math.max(1, Date.now() - startRef.current.time) * 1000;
    const shouldSwipe = Math.abs(dragX) > SWIPE_THRESHOLD || velocity > 600;

    if (shouldSwipe) {
      const dir = dragX > 0 ? 1 : -1;
      setExitDir(dir);
      setIsExiting(true);
      setDragX(dir * window.innerWidth * 1.2);
      setDragY(0);

      setTimeout(() => {
        if (current >= items.length - 1) {
          onComplete();
        } else {
          setCurrent(c => c + 1);
        }
        setDragX(0);
        setDragY(0);
        setIsExiting(false);
        setExitDir(0);
      }, 400);
    } else {
      // Snap back
      setDragX(0);
      setDragY(0);
    }
  }, [isDragging, isExiting, dragX, current, items.length, onComplete]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX, e.clientY); };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  const rotation = dragX * 0.08;
  const scale = 1 - Math.min(Math.abs(dragX) * 0.0003, 0.05);
  const opacity = 1 - Math.min(Math.abs(dragX) * 0.002, 0.6);

  return (
    <div className="relative w-full" style={{ height: '520px' }}>
      {/* Background stacked cards */}
      {[2, 1].map((offset) => {
        const idx = current + offset;
        if (idx >= items.length) return null;
        const item = items[idx];
        const meta = VIRAL_META[item.category];
        // Cards behind: progressively smaller, lower, more transparent
        const behindScale = 1 - offset * 0.04;
        const behindY = offset * 12;
        return (
          <div
            key={`bg-${idx}`}
            className="absolute inset-x-0 top-0 mx-auto"
            style={{
              transform: `translateY(${behindY}px) scale(${behindScale})`,
              opacity: 0.7 - offset * 0.2,
              zIndex: 10 - offset,
              transformOrigin: 'top center',
            }}
          >
            <div className="rounded-3xl overflow-hidden border border-white/15 backdrop-blur-xl bg-white/[0.06] shadow-2xl" style={{ height: '500px' }}>
              {item.image_url && (
                <div className="h-44 overflow-hidden">
                  <img src={item.image_url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-40" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Active draggable card */}
      {current < items.length && (() => {
        const item = items[current];
        const meta = VIRAL_META[item.category] || VIRAL_META.viral_music;
        const Icon = meta.icon;

        return (
          <div
            ref={cardRef}
            className={cn(
              "absolute inset-x-0 top-0 mx-auto z-30 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab",
              !isDragging && !isExiting && "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
              isExiting && "transition-all duration-400 ease-out"
            )}
            style={{
              transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg) scale(${scale})`,
              opacity: isExiting ? 0 : opacity,
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            <div className="rounded-3xl overflow-hidden border border-white/20 backdrop-blur-2xl bg-white/[0.08] shadow-[0_8px_60px_-12px_rgba(0,0,0,0.25)] ring-1 ring-white/10" style={{ height: '500px' }}>
              
              {/* Card image area */}
              {item.image_url ? (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Category badge on image */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 backdrop-blur-md bg-white/10 rounded-full px-3 py-1.5 border border-white/15">
                    <Icon size={12} className="text-white/80" strokeWidth={2} />
                    <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/80">{meta.label}</span>
                  </div>

                  {/* Year on image */}
                  {item.year && item.year !== "Unknown" && (
                    <div className="absolute bottom-3 right-4">
                      <span className="text-3xl font-serif font-light text-white/30 tracking-tight">{item.year}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn("h-32 flex items-end p-5 bg-gradient-to-br", meta.gradFrom, meta.gradTo)}>
                  <div className="flex items-center gap-2 backdrop-blur-md bg-white/10 rounded-full px-3 py-1.5 border border-white/15">
                    <Icon size={12} className="text-white/80" strokeWidth={2} />
                    <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/80">{meta.label}</span>
                  </div>
                </div>
              )}

              {/* Card text content */}
              <div className="p-5 flex flex-col" style={{ height: item.image_url ? '308px' : '376px' }}>
                <h2 className="font-serif text-xl md:text-2xl text-ink-navy leading-snug mb-3 line-clamp-2">{item.title}</h2>
                
                <p className="text-sm text-ink-navy/65 leading-relaxed mb-4 line-clamp-3">{item.short_explanation}</p>
                
                {item.why_it_matters && (
                  <p className="text-[13px] text-ink-navy/40 font-serif italic leading-relaxed line-clamp-4 flex-1">{item.why_it_matters}</p>
                )}

                {item.metadata_spotify_track_id && (
                  <div className="mt-auto pt-3">
                    <iframe src={`https://open.spotify.com/embed/track/${item.metadata_spotify_track_id}?theme=0`} width="100%" height="80" frameBorder="0" allow="encrypted-media" className="rounded-lg" />
                  </div>
                )}

                {/* Swipe hint */}
                <div className="mt-auto pt-4 flex items-center justify-center gap-2 opacity-30">
                  <div className="w-8 h-[2px] bg-ink-navy/40 rounded-full" />
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-ink-navy/40">
                    Desliza para continuar
                  </span>
                  <div className="w-8 h-[2px] bg-ink-navy/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Card counter dots */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <div key={i} className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            i === current ? "bg-ink-navy/50 scale-125" : i < current ? "bg-ink-navy/15" : "bg-ink-navy/10"
          )} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

export default function ViralPage() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    async function load() {
      const todayStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
      setDateLabel(todayStr);
      const { data: rows } = await supabase.from("daily_briefings").select("*, briefing_items (*)").eq("date", todayStr).limit(1);
      if (rows && rows.length > 0 && rows[0].briefing_items) {
        const viral = rows[0].briefing_items.filter((i: any) => i.category.startsWith("viral_"));
        setItems(viral);
        setQuizQuestions(generateQuiz(viral.length > 0 ? viral : rows[0].briefing_items));
      }
      setLoading(false);
    }
    load();
  }, [language]);

  const handleAnswer = (idx: number) => { if (answered) return; setSelectedAnswer(idx); setAnswered(true); if (idx === quizQuestions[currentQ].correctIndex) setScore(s => s + 1); };
  const nextQuestion = () => { if (currentQ + 1 >= quizQuestions.length) setQuizDone(true); else { setCurrentQ(q => q + 1); setSelectedAnswer(null); setAnswered(false); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mist-white"><div className="w-6 h-6 border-t-2 border-ink-navy rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-mist-white via-mist-white to-slate-100/50 pt-14 md:pt-20 pb-28 md:pb-16 flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-16 pb-4">
        <div className="max-w-lg mx-auto text-center">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-ink-navy/20 block mb-1">{dateLabel}</span>
          <h1 className="font-serif text-3xl md:text-4xl text-ink-navy tracking-tight">Viral</h1>
        </div>
      </header>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-16">
        <div className="w-full max-w-sm md:max-w-md relative">

          {!showQuiz && items.length > 0 ? (
            <SwipeCardStack items={items} onComplete={() => setShowQuiz(true)} />
          ) : !showQuiz ? (
            <div className="rounded-3xl border border-white/20 backdrop-blur-xl bg-white/10 p-10 text-center shadow-xl">
              <Flame size={28} className="mx-auto text-ink-navy/15 mb-3" />
              <p className="text-sm text-ink-navy/30 font-serif italic">Contenido viral generándose...</p>
            </div>
          ) : null}

          {/* Quiz */}
          {showQuiz && quizQuestions.length > 0 && (
            <div className="animate-fade-rise">
              <div className="text-center mb-5">
                <Brain size={20} className="mx-auto text-ink-navy/25 mb-2" />
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/25">Quiz del Día</span>
              </div>

              {quizDone ? (
                <div className="rounded-3xl border border-white/20 backdrop-blur-xl bg-white/[0.08] p-8 text-center shadow-xl">
                  <div className="w-16 h-16 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
                  </div>
                  <h3 className="font-serif text-xl text-ink-navy mb-1">{score === quizQuestions.length ? "Perfecto." : score >= quizQuestions.length / 2 ? "Bien hecho." : "A mejorar."}</h3>
                  <p className="text-xs text-ink-navy/30 font-serif italic mb-5">{score}/{quizQuestions.length} correctas</p>
                  <button onClick={() => { setShowQuiz(false); setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); }}
                    className="bg-ink-navy text-mist-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors">
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/20 backdrop-blur-xl bg-white/[0.08] overflow-hidden shadow-xl">
                  <div className="h-1 bg-ink-navy/5"><div className="h-full bg-ink-navy transition-all duration-500" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} /></div>
                  <div className="p-5 md:p-7">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/20 block mb-3">{currentQ + 1} / {quizQuestions.length}</span>
                    <h3 className="font-serif text-base md:text-lg text-ink-navy mb-6 leading-snug">{quizQuestions[currentQ].question}</h3>
                    <div className="flex flex-col gap-2.5">
                      {quizQuestions[currentQ].options.map((opt, idx) => {
                        const isC = idx === quizQuestions[currentQ].correctIndex;
                        const isS = selectedAnswer === idx;
                        return (
                          <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                            className={cn("flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all", !answered && "hover:border-ink-navy/15 cursor-pointer border-ink-navy/8", answered && isC && "border-emerald-400 bg-emerald-50/50", answered && isS && !isC && "border-red-300 bg-red-50/50", answered && !isC && !isS && "opacity-35")}>
                            <span className={cn("w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold", answered && isC ? "bg-emerald-500 border-emerald-500 text-white" : "", answered && isS && !isC ? "bg-red-400 border-red-400 text-white" : "", !answered ? "border-ink-navy/12 text-ink-navy/25" : "")}>
                              {answered && isC ? <Check size={12} /> : answered && isS && !isC ? <X size={12} /> : String.fromCharCode(65 + idx)}
                            </span>
                            <span className={cn("font-bold text-sm", answered && isC ? "text-emerald-700" : "text-ink-navy/55")}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <button onClick={nextQuestion}
                        className="w-full mt-5 flex items-center justify-center gap-2 bg-ink-navy text-mist-white py-3 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors">
                        {currentQ + 1 >= quizQuestions.length ? "Ver resultado" : "Siguiente"} <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
