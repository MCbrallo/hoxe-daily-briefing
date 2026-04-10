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

const VIRAL_META: Record<string, { icon: any; label: string }> = {
  viral_music:   { icon: Music,      label: "Nº1 DEL DÍA" },
  viral_scandal: { icon: Flame,      label: "EL ESCÁNDALO" },
  viral_movie:   { icon: Film,       label: "ESTRENO DEL DÍA" },
  viral_quote:   { icon: Quote,      label: "IN MEMORIAM" },
  viral_moment:  { icon: Smartphone, label: "MOMENTO VIRAL" },
  viral_record:  { icon: Trophy,     label: "RÉCORD ROTO" },
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
// SWIPEABLE CARD STACK — Full-bleed, no buttons
// ═══════════════════════════════════════════════

function SwipeStack({ items, onComplete }: { items: ViralItem[]; onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startRef = useRef({ x: 0, y: 0, time: 0 });

  const THRESHOLD = 70;

  const handleStart = useCallback((cx: number, cy: number) => {
    if (isExiting) return;
    startRef.current = { x: cx, y: cy, time: Date.now() };
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
    if (Math.abs(dragX) > THRESHOLD || vel > 500) {
      const dir = dragX > 0 ? 1 : -1;
      setIsExiting(true);
      setDragX(dir * window.innerWidth * 1.5);
      setTimeout(() => {
        if (current >= items.length - 1) onComplete();
        else setCurrent(c => c + 1);
        setDragX(0);
        setIsExiting(false);
      }, 350);
    } else {
      setDragX(0);
    }
  }, [isDragging, isExiting, dragX, current, items.length, onComplete]);

  const onTS = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTM = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTE = () => handleEnd();
  const onMD = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX, e.clientY); };
  const onMM = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMU = () => handleEnd();
  const onML = () => { if (isDragging) handleEnd(); };

  const rot = dragX * 0.06;

  return (
    <div className="relative w-full flex-1 flex items-center justify-center">
      {/* Background stack */}
      {[2, 1].map(offset => {
        const idx = current + offset;
        if (idx >= items.length) return null;
        return (
          <div key={`s${idx}`} className="absolute inset-x-0 mx-auto"
            style={{ width: `calc(100% - ${offset * 20}px)`, height: 'calc(100% - 16px)', transform: `translateY(${offset * 10}px) scale(${1 - offset * 0.03})`, opacity: 0.6 - offset * 0.2, zIndex: 10 - offset, transformOrigin: 'top center' }}>
            <div className="w-full h-full rounded-[28px] bg-white/[0.06] backdrop-blur-lg border border-white/10 shadow-xl" />
          </div>
        );
      })}

      {/* Active card */}
      {current < items.length && (() => {
        const item = items[current];
        const meta = VIRAL_META[item.category] || VIRAL_META.viral_music;
        const Icon = meta.icon;
        const hasImage = !!item.image_url;

        return (
          <div
            className={cn(
              "absolute inset-x-0 mx-auto z-30 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab",
              !isDragging && !isExiting && "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
              isExiting && "transition-all duration-[350ms] ease-out pointer-events-none"
            )}
            style={{
              width: '100%',
              height: 'calc(100% - 16px)',
              transform: `translateX(${dragX}px) rotate(${rot}deg)`,
              opacity: isExiting ? 0 : 1 - Math.min(Math.abs(dragX) * 0.0015, 0.5),
            }}
            onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
            onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onML}
          >
            <div className="w-full h-full rounded-[28px] overflow-hidden border border-white/20 backdrop-blur-2xl bg-white/[0.07] shadow-[0_12px_80px_-16px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.08] flex flex-col">

              {/* Image: takes ~45% of card if available */}
              {hasImage ? (
                <div className="relative flex-[0_0_45%] overflow-hidden">
                  <img src={item.image_url!} alt={item.title} referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                  {/* Category pill */}
                  <div className="absolute top-5 left-5 flex items-center gap-2 backdrop-blur-xl bg-black/20 rounded-full px-3.5 py-1.5 border border-white/15">
                    <Icon size={11} className="text-white/80" strokeWidth={2.5} />
                    <span className="text-[9px] font-bold tracking-[0.2em] text-white/80">{meta.label}</span>
                  </div>

                  {/* Year watermark */}
                  {item.year && item.year !== "Unknown" && (
                    <span className="absolute bottom-4 right-5 text-5xl md:text-6xl font-serif font-light text-white/15 tracking-tighter leading-none">{item.year}</span>
                  )}
                </div>
              ) : (
                <div className="flex-[0_0_25%] flex flex-col justify-end p-6 bg-gradient-to-b from-ink-navy/[0.03] to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-ink-navy/30" strokeWidth={2} />
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-ink-navy/30">{meta.label}</span>
                  </div>
                  {item.year && item.year !== "Unknown" && (
                    <span className="text-5xl md:text-6xl font-serif font-light text-ink-navy/8 tracking-tighter leading-none">{item.year}</span>
                  )}
                </div>
              )}

              {/* Text content */}
              <div className="flex-1 flex flex-col justify-between p-6 md:p-7">
                <div>
                  {!hasImage && item.year && item.year !== "Unknown" && (
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink-navy/20 block mb-1">{item.year}</span>
                  )}
                  <h2 className="font-serif text-2xl md:text-3xl text-ink-navy leading-[1.15] tracking-tight mb-4">{item.title}</h2>
                  <p className="text-[15px] md:text-base text-ink-navy/55 leading-relaxed">{item.short_explanation}</p>
                  {item.why_it_matters && (
                    <p className="text-sm text-ink-navy/35 font-serif italic leading-relaxed mt-4 line-clamp-3">{item.why_it_matters}</p>
                  )}
                </div>

                {/* Swipe indicator */}
                <div className="flex items-center justify-center gap-3 pt-4">
                  <div className="flex gap-1.5">
                    {items.map((_, i) => (
                      <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300",
                        i === current ? "bg-ink-navy/40 w-4" : i < current ? "bg-ink-navy/10" : "bg-ink-navy/8"
                      )} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mist-white"><div className="w-6 h-6 border-t-2 border-ink-navy rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f8f7f4] via-[#f2f1ee] to-[#eae8e4] flex flex-col pt-14 md:pt-20 pb-20 md:pb-6">
      {/* Minimal header */}
      <header className="px-6 pb-3 shrink-0">
        <div className="max-w-md mx-auto flex items-baseline justify-between">
          <h1 className="font-serif text-2xl text-ink-navy tracking-tight">Viral</h1>
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/20">{dateLabel}</span>
        </div>
      </header>

      {/* Card area — fills remaining space */}
      <div className="flex-1 flex flex-col px-4 md:px-16 min-h-0">
        <div className="w-full max-w-md mx-auto flex-1 relative flex flex-col min-h-0">

          {!showQuiz && items.length > 0 ? (
            <SwipeStack items={items} onComplete={() => setShowQuiz(true)} />
          ) : !showQuiz ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="rounded-[28px] border border-white/20 backdrop-blur-xl bg-white/10 p-10 text-center shadow-xl">
                <Flame size={24} className="mx-auto text-ink-navy/12 mb-3" />
                <p className="text-sm text-ink-navy/25 font-serif italic">Contenido viral generándose...</p>
              </div>
            </div>
          ) : null}

          {/* Quiz */}
          {showQuiz && quizQuestions.length > 0 && (
            <div className="flex-1 flex items-center justify-center animate-fade-rise">
              <div className="w-full">
                <div className="text-center mb-4">
                  <Brain size={18} className="mx-auto text-ink-navy/20 mb-1" />
                  <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/20">Quiz del Día</span>
                </div>
                {quizDone ? (
                  <div className="rounded-[28px] border border-white/20 backdrop-blur-xl bg-white/[0.08] p-8 text-center shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
                    </div>
                    <h3 className="font-serif text-xl text-ink-navy mb-1">{score === quizQuestions.length ? "Perfecto." : score >= quizQuestions.length / 2 ? "Bien hecho." : "A mejorar."}</h3>
                    <p className="text-xs text-ink-navy/25 font-serif italic mb-5">{score}/{quizQuestions.length} correctas</p>
                    <button onClick={() => { setShowQuiz(false); setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); }}
                      className="bg-ink-navy text-mist-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors">Reintentar</button>
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-white/20 backdrop-blur-xl bg-white/[0.08] overflow-hidden shadow-xl">
                    <div className="h-1 bg-ink-navy/5"><div className="h-full bg-ink-navy transition-all duration-500" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} /></div>
                    <div className="p-5 md:p-7">
                      <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/20 block mb-3">{currentQ + 1} / {quizQuestions.length}</span>
                      <h3 className="font-serif text-base md:text-lg text-ink-navy mb-5 leading-snug">{quizQuestions[currentQ].question}</h3>
                      <div className="flex flex-col gap-2">
                        {quizQuestions[currentQ].options.map((opt, idx) => {
                          const isC = idx === quizQuestions[currentQ].correctIndex;
                          const isS = selectedAnswer === idx;
                          return (
                            <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                              className={cn("flex items-center gap-3 p-3 rounded-xl border text-left transition-all", !answered && "hover:border-ink-navy/12 cursor-pointer border-ink-navy/6", answered && isC && "border-emerald-400 bg-emerald-50/60", answered && isS && !isC && "border-red-300 bg-red-50/60", answered && !isC && !isS && "opacity-30")}>
                              <span className={cn("w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold", answered && isC ? "bg-emerald-500 border-emerald-500 text-white" : "", answered && isS && !isC ? "bg-red-400 border-red-400 text-white" : "", !answered ? "border-ink-navy/10 text-ink-navy/20" : "")}>
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
