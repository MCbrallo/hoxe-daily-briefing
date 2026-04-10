"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Flame, Film, Quote, Smartphone, Trophy, Brain, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
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

// Each category gets a RICH color scheme
const VIRAL_META: Record<string, {
  icon: any; label: string;
  cardBg: string; cardBorder: string; accent: string; yearColor: string; pillBg: string; pillText: string; dotActive: string;
}> = {
  viral_music: {
    icon: Music, label: "Nº1 DEL DÍA",
    cardBg: "bg-gradient-to-br from-[#2D1B69] via-[#1E1145] to-[#0F0A2A]",
    cardBorder: "border-purple-400/20",
    accent: "text-purple-200",
    yearColor: "text-purple-500/20",
    pillBg: "bg-purple-500/20",
    pillText: "text-purple-200",
    dotActive: "bg-purple-400",
  },
  viral_scandal: {
    icon: Flame, label: "EL ESCÁNDALO",
    cardBg: "bg-gradient-to-br from-[#4A0E0E] via-[#2D0808] to-[#1A0505]",
    cardBorder: "border-red-400/20",
    accent: "text-red-200",
    yearColor: "text-red-500/15",
    pillBg: "bg-red-500/20",
    pillText: "text-red-200",
    dotActive: "bg-red-400",
  },
  viral_movie: {
    icon: Film, label: "ESTRENO DEL DÍA",
    cardBg: "bg-gradient-to-br from-[#4A3500] via-[#2D2000] to-[#1A1300]",
    cardBorder: "border-amber-400/20",
    accent: "text-amber-200",
    yearColor: "text-amber-500/15",
    pillBg: "bg-amber-500/20",
    pillText: "text-amber-200",
    dotActive: "bg-amber-400",
  },
  viral_quote: {
    icon: Quote, label: "IN MEMORIAM",
    cardBg: "bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A0F1A]",
    cardBorder: "border-slate-400/20",
    accent: "text-slate-300",
    yearColor: "text-slate-500/15",
    pillBg: "bg-slate-500/20",
    pillText: "text-slate-300",
    dotActive: "bg-slate-400",
  },
  viral_moment: {
    icon: Smartphone, label: "MOMENTO VIRAL",
    cardBg: "bg-gradient-to-br from-[#0C4A6E] via-[#082F49] to-[#051D2F]",
    cardBorder: "border-sky-400/20",
    accent: "text-sky-200",
    yearColor: "text-sky-500/15",
    pillBg: "bg-sky-500/20",
    pillText: "text-sky-200",
    dotActive: "bg-sky-400",
  },
  viral_record: {
    icon: Trophy, label: "RÉCORD ROTO",
    cardBg: "bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#011A14]",
    cardBorder: "border-emerald-400/20",
    accent: "text-emerald-200",
    yearColor: "text-emerald-500/15",
    pillBg: "bg-emerald-500/20",
    pillText: "text-emerald-200",
    dotActive: "bg-emerald-400",
  },
};

const FALLBACK_META = VIRAL_META.viral_music;

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
// SWIPEABLE CARD STACK — Bidirectional
// ═══════════════════════════════════════════════

function SwipeStack({ items, onComplete }: { items: ViralItem[]; onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [enterDir, setEnterDir] = useState(0); // 0=none, -1=from left, 1=from right
  const startRef = useRef({ x: 0, time: 0 });

  const THRESHOLD = 65;

  const handleStart = useCallback((cx: number) => {
    if (isExiting) return;
    startRef.current = { x: cx, time: Date.now() };
    setIsDragging(true);
  }, [isExiting]);

  const handleMove = useCallback((cx: number) => {
    if (!isDragging || isExiting) return;
    setDragX(cx - startRef.current.x);
  }, [isDragging, isExiting]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);
    const vel = Math.abs(dragX) / Math.max(1, Date.now() - startRef.current.time) * 1000;
    const shouldSwipe = Math.abs(dragX) > THRESHOLD || vel > 500;

    if (shouldSwipe) {
      const dir = dragX > 0 ? 1 : -1; // 1 = swiped right, -1 = swiped left

      // Swipe RIGHT → go BACK (if not first)
      if (dir === 1 && current > 0) {
        setIsExiting(true);
        setDragX(window.innerWidth * 1.5);
        setTimeout(() => {
          setCurrent(c => c - 1);
          setEnterDir(-1); // enter from left
          setDragX(0);
          setIsExiting(false);
        }, 300);
        return;
      }

      // Swipe LEFT → go FORWARD
      if (dir === -1) {
        if (current >= items.length - 1) {
          onComplete();
          return;
        }
        setIsExiting(true);
        setDragX(-window.innerWidth * 1.5);
        setTimeout(() => {
          setCurrent(c => c + 1);
          setEnterDir(1); // enter from right
          setDragX(0);
          setIsExiting(false);
        }, 300);
        return;
      }

      // First card swiped right — snap back
      setDragX(0);
    } else {
      setDragX(0);
    }
  }, [isDragging, isExiting, dragX, current, items.length, onComplete]);

  // Reset enter animation
  useEffect(() => {
    if (enterDir !== 0) {
      const t = setTimeout(() => setEnterDir(0), 50);
      return () => clearTimeout(t);
    }
  }, [enterDir]);

  const onTS = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTM = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTE = () => handleEnd();
  const onMD = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX); };
  const onMM = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMU = () => handleEnd();
  const onML = () => { if (isDragging) handleEnd(); };

  const rot = dragX * 0.05;
  const item = items[current];
  const meta = VIRAL_META[item?.category] || FALLBACK_META;
  const Icon = meta.icon;

  return (
    <div className="relative w-full flex-1 flex items-center justify-center">
      {/* Background stacked cards */}
      {[2, 1].map(offset => {
        const idx = current + offset;
        if (idx >= items.length) return null;
        const m = VIRAL_META[items[idx].category] || FALLBACK_META;
        return (
          <div key={`s${idx}`} className="absolute inset-x-0 mx-auto"
            style={{ width: `calc(100% - ${offset * 16}px)`, height: 'calc(100% - 12px)', transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.025})`, opacity: 0.5 - offset * 0.15, zIndex: 10 - offset }}>
            <div className={cn("w-full h-full rounded-[24px] border shadow-lg", m.cardBg, m.cardBorder)} />
          </div>
        );
      })}

      {/* Swipe direction hints */}
      {current > 0 && !isExiting && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-40 opacity-20 pointer-events-none">
          <ChevronLeft size={20} className="text-white" />
        </div>
      )}
      {current < items.length - 1 && !isExiting && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-40 opacity-20 pointer-events-none">
          <ChevronRight size={20} className="text-white" />
        </div>
      )}

      {/* Active card */}
      {current < items.length && (
        <div
          className={cn(
            "absolute inset-x-0 mx-auto z-30 select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
            !isDragging && !isExiting && "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isExiting && "transition-all duration-300 ease-out pointer-events-none"
          )}
          style={{
            width: '100%',
            height: 'calc(100% - 12px)',
            transform: `translateX(${enterDir !== 0 && !isDragging ? enterDir * 300 : dragX}px) rotate(${rot}deg)`,
            opacity: isExiting ? 0 : 1 - Math.min(Math.abs(dragX) * 0.0012, 0.4),
          }}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onML}
        >
          <div className={cn("w-full h-full rounded-[24px] overflow-hidden border shadow-[0_16px_80px_-12px_rgba(0,0,0,0.5)] flex flex-col", meta.cardBg, meta.cardBorder)}>

            {/* Image area */}
            {item.image_url ? (
              <div className="relative flex-[0_0_42%] overflow-hidden">
                <img src={item.image_url} alt={item.title} referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Category pill */}
                <div className={cn("absolute top-4 left-4 flex items-center gap-2 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/10", meta.pillBg)}>
                  <Icon size={11} className={meta.pillText} strokeWidth={2.5} />
                  <span className={cn("text-[8px] font-bold tracking-[0.2em]", meta.pillText)}>{meta.label}</span>
                </div>

                {/* Counter pill */}
                <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/30 rounded-full px-2.5 py-1 border border-white/10">
                  <span className="text-[9px] font-bold text-white/60">{current + 1}/{items.length}</span>
                </div>

                {/* Year watermark */}
                {item.year && item.year !== "Unknown" && (
                  <span className="absolute bottom-3 right-4 text-6xl font-serif font-light text-white/10 tracking-tighter leading-none">{item.year}</span>
                )}
              </div>
            ) : (
              /* No-image header */
              <div className="flex-[0_0_28%] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <div className={cn("flex items-center gap-2 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/10", meta.pillBg)}>
                    <Icon size={11} className={meta.pillText} strokeWidth={2.5} />
                    <span className={cn("text-[8px] font-bold tracking-[0.2em]", meta.pillText)}>{meta.label}</span>
                  </div>
                  <span className="text-[9px] font-bold text-white/30">{current + 1}/{items.length}</span>
                </div>
                <div>
                  {item.year && item.year !== "Unknown" && (
                    <span className={cn("text-7xl font-serif font-light tracking-tighter leading-none", meta.yearColor)}>{item.year}</span>
                  )}
                </div>
              </div>
            )}

            {/* Text content */}
            <div className="flex-1 flex flex-col justify-between p-5 md:p-6 min-h-0">
              <div className="overflow-hidden">
                {!item.image_url && item.year && item.year !== "Unknown" && (
                  <span className={cn("text-[10px] font-bold tracking-[0.2em] uppercase block mb-1", meta.accent, "opacity-40")}>{item.year}</span>
                )}
                <h2 className={cn("font-serif text-[22px] md:text-[26px] leading-[1.15] tracking-tight mb-3", meta.accent)}>{item.title}</h2>
                <p className="text-[14px] text-white/50 leading-relaxed mb-3 line-clamp-3">{item.short_explanation}</p>
                {item.why_it_matters && (
                  <p className="text-[13px] text-white/30 font-serif italic leading-relaxed line-clamp-3">{item.why_it_matters}</p>
                )}
              </div>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-2 pt-3">
                {items.map((_, i) => (
                  <div key={i} className={cn(
                    "h-1 rounded-full transition-all duration-400",
                    i === current ? cn("w-6", meta.dotActive) : i < current ? "w-1.5 bg-white/15" : "w-1.5 bg-white/8"
                  )} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
  const nextQ = () => { if (currentQ + 1 >= quizQuestions.length) setQuizDone(true); else { setCurrentQ(q => q + 1); setSelectedAnswer(null); setAnswered(false); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mist-white"><div className="w-6 h-6 border-t-2 border-ink-navy/30 rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-mist-white flex flex-col pt-14 md:pt-20 pb-20 md:pb-6">
      {/* Header */}
      <header className="px-6 pb-3 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-red-500" strokeWidth={2.2} />
            <h1 className="font-serif text-xl text-ink-navy tracking-tight">Viral</h1>
          </div>
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/20">{dateLabel}</span>
        </div>
      </header>

      {/* Card area */}
      <div className="flex-1 flex flex-col px-4 md:px-16 min-h-0">
        <div className="w-full max-w-md mx-auto flex-1 relative flex flex-col min-h-0">

          {!showQuiz && items.length > 0 ? (
            <SwipeStack items={items} onComplete={() => setShowQuiz(true)} />
          ) : !showQuiz ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="rounded-[24px] border border-ink-navy/8 bg-ink-navy/[0.02] p-10 text-center">
                <Flame size={24} className="mx-auto text-ink-navy/10 mb-3" />
                <p className="text-sm text-ink-navy/25 font-serif italic">Contenido viral generándose...</p>
              </div>
            </div>
          ) : null}

          {/* Quiz */}
          {showQuiz && quizQuestions.length > 0 && (
            <div className="flex-1 flex items-center justify-center animate-fade-rise">
              <div className="w-full">
                <div className="text-center mb-4">
                  <Brain size={18} className="mx-auto text-ink-navy/15 mb-1" />
                  <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/25">Quiz del Día</span>
                </div>
                {quizDone ? (
                  <div className="rounded-[24px] border border-ink-navy/8 bg-white p-8 text-center shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
                    </div>
                    <h3 className="font-serif text-xl text-ink-navy mb-1">{score === quizQuestions.length ? "Perfecto." : score >= quizQuestions.length / 2 ? "Bien hecho." : "A mejorar."}</h3>
                    <p className="text-xs text-ink-navy/30 font-serif italic mb-5">{score}/{quizQuestions.length} correctas</p>
                    <button onClick={() => { setShowQuiz(false); setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); }}
                      className="bg-ink-navy text-mist-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors">Reintentar</button>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-ink-navy/8 bg-white overflow-hidden shadow-lg">
                    <div className="h-1 bg-ink-navy/5"><div className="h-full bg-ink-navy transition-all duration-500" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} /></div>
                    <div className="p-5 md:p-7">
                      <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/25 block mb-3">{currentQ + 1} / {quizQuestions.length}</span>
                      <h3 className="font-serif text-base md:text-lg text-ink-navy mb-5 leading-snug">{quizQuestions[currentQ].question}</h3>
                      <div className="flex flex-col gap-2">
                        {quizQuestions[currentQ].options.map((opt, idx) => {
                          const isC = idx === quizQuestions[currentQ].correctIndex;
                          const isS = selectedAnswer === idx;
                          return (
                            <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                              className={cn("flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                !answered && "hover:border-ink-navy/15 cursor-pointer border-ink-navy/8",
                                answered && isC && "border-emerald-400 bg-emerald-50/60",
                                answered && isS && !isC && "border-red-300 bg-red-50/60",
                                answered && !isC && !isS && "opacity-30")}>
                              <span className={cn("w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold",
                                answered && isC ? "bg-emerald-500 border-emerald-500 text-white" : "",
                                answered && isS && !isC ? "bg-red-400 border-red-400 text-white" : "",
                                !answered ? "border-ink-navy/12 text-ink-navy/25" : "")}>
                                {answered && isC ? <Check size={12} /> : answered && isS && !isC ? <X size={12} /> : String.fromCharCode(65 + idx)}
                              </span>
                              <span className={cn("font-bold text-sm", answered && isC ? "text-emerald-700" : "text-ink-navy/50")}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <button onClick={nextQ}
                          className="w-full mt-4 flex items-center justify-center gap-2 bg-ink-navy text-mist-white py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors">
                          {currentQ + 1 >= quizQuestions.length ? "Ver resultado" : "Siguiente"} <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
