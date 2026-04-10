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

const VIRAL_META: Record<string, {
  icon: any; label: string;
  gradient: string; pillBg: string; pillText: string; dotColor: string;
}> = {
  viral_music:   { icon: Music,      label: "Nº1 DEL DÍA",     gradient: "from-violet-950 via-purple-900 to-fuchsia-950", pillBg: "bg-violet-400/20",  pillText: "text-violet-200",  dotColor: "bg-violet-400" },
  viral_scandal: { icon: Flame,      label: "EL ESCÁNDALO",     gradient: "from-rose-950 via-red-900 to-orange-950",       pillBg: "bg-rose-400/20",    pillText: "text-rose-200",    dotColor: "bg-rose-400" },
  viral_movie:   { icon: Film,       label: "ESTRENO DEL DÍA",  gradient: "from-amber-950 via-orange-900 to-yellow-950",   pillBg: "bg-amber-400/20",   pillText: "text-amber-200",   dotColor: "bg-amber-400" },
  viral_quote:   { icon: Quote,      label: "IN MEMORIAM",      gradient: "from-slate-900 via-zinc-800 to-neutral-900",    pillBg: "bg-slate-400/20",   pillText: "text-slate-300",   dotColor: "bg-slate-400" },
  viral_moment:  { icon: Smartphone, label: "MOMENTO VIRAL",    gradient: "from-cyan-950 via-sky-900 to-blue-950",         pillBg: "bg-sky-400/20",     pillText: "text-sky-200",     dotColor: "bg-sky-400" },
  viral_record:  { icon: Trophy,     label: "RÉCORD ROTO",      gradient: "from-emerald-950 via-green-900 to-teal-950",    pillBg: "bg-emerald-400/20", pillText: "text-emerald-200", dotColor: "bg-emerald-400" },
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

// ─────────────────────────────────────────
// SWIPEABLE CARD STACK
// ─────────────────────────────────────────

function SwipeStack({ items, onComplete }: { items: ViralItem[]; onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
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
    if (Math.abs(dragX) > THRESHOLD || vel > 500) {
      const dir = dragX > 0 ? 1 : -1;
      // Right = back, Left = forward
      if (dir === 1 && current > 0) {
        setIsExiting(true); setDragX(window.innerWidth * 1.5);
        setTimeout(() => { setCurrent(c => c - 1); setDragX(0); setIsExiting(false); }, 280);
      } else if (dir === -1) {
        if (current >= items.length - 1) { onComplete(); return; }
        setIsExiting(true); setDragX(-window.innerWidth * 1.5);
        setTimeout(() => { setCurrent(c => c + 1); setDragX(0); setIsExiting(false); }, 280);
      } else { setDragX(0); }
    } else { setDragX(0); }
  }, [isDragging, isExiting, dragX, current, items.length, onComplete]);

  const onTS = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTM = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTE = () => handleEnd();
  const onMD = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX); };
  const onMM = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMU = () => handleEnd();
  const onML = () => { if (isDragging) handleEnd(); };

  const rot = dragX * 0.04;
  const item = items[current];
  const meta = VIRAL_META[item?.category] || FALLBACK_META;
  const Icon = meta.icon;

  return (
    <div className="relative w-full" style={{ height: '440px' }}>

      {/* Stacked cards behind */}
      {[2, 1].map(offset => {
        const idx = current + offset;
        if (idx >= items.length) return null;
        const m = VIRAL_META[items[idx].category] || FALLBACK_META;
        return (
          <div key={`s${idx}`} className="absolute inset-x-0 mx-auto rounded-[20px] overflow-hidden"
            style={{
              width: `calc(100% - ${offset * 20}px)`,
              height: '420px',
              transform: `translateY(${offset * 10}px)`,
              opacity: 0.5 - offset * 0.15,
              zIndex: 10 - offset,
            }}>
            <div className={cn("w-full h-full bg-gradient-to-br", m.gradient)} />
          </div>
        );
      })}

      {/* Active card */}
      {current < items.length && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 mx-auto z-30 select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
            !isDragging && !isExiting && "transition-all duration-[450ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
            isExiting && "transition-all duration-[280ms] ease-out pointer-events-none"
          )}
          style={{
            width: '100%', height: '420px',
            transform: `translateX(${dragX}px) rotate(${rot}deg)`,
            opacity: isExiting ? 0 : 1 - Math.min(Math.abs(dragX) * 0.001, 0.35),
          }}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onML}
        >
          <div className={cn("w-full h-full rounded-[20px] overflow-hidden relative shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]")}>

            {/* Full-bleed image or gradient background */}
            {item.image_url ? (
              <>
                <img src={item.image_url} alt={item.title} referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.classList.add('bg-gradient-to-br', ...meta.gradient.split(' '));
                  }}
                  className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
              </>
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", meta.gradient)} />
            )}

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 border border-white/15 backdrop-blur-md", meta.pillBg)}>
                  <Icon size={10} className={meta.pillText} strokeWidth={2.5} />
                  <span className={cn("text-[8px] font-bold tracking-[0.18em]", meta.pillText)}>{meta.label}</span>
                </div>
                <span className="text-[10px] font-bold text-white/40 backdrop-blur-md bg-black/20 rounded-full px-2.5 py-1 border border-white/10">
                  {current + 1}/{items.length}
                </span>
              </div>

              {/* Bottom text block */}
              <div>
                {item.year && item.year !== "Unknown" && (
                  <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-white/35 block mb-1">{item.year}</span>
                )}
                <h2 className="font-serif text-[28px] md:text-[34px] leading-[1.05] tracking-tight text-white font-medium mb-2.5 line-clamp-3 drop-shadow-lg">
                  {item.title}
                </h2>
                <p className="text-[13px] text-white/60 leading-relaxed line-clamp-2 drop-shadow-md">
                  {item.short_explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <div key={i} className={cn(
            "h-[3px] rounded-full transition-all duration-300",
            i === current ? cn("w-5", meta.dotColor) : i < current ? "w-1.5 bg-ink-navy/15" : "w-1.5 bg-ink-navy/8"
          )} />
        ))}
      </div>
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
    <div className="min-h-screen bg-mist-white pt-14 md:pt-20 pb-24 md:pb-8 flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-16 pb-5 pt-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame size={20} className="text-red-500" strokeWidth={2} />
            <h1 className="font-serif text-2xl text-ink-navy tracking-tight">Viral</h1>
          </div>
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/20">{dateLabel}</span>
        </div>
      </header>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 md:px-16">
        <div className="w-full max-w-sm md:max-w-md">

          {!showQuiz && items.length > 0 ? (
            <SwipeStack items={items} onComplete={() => setShowQuiz(true)} />
          ) : !showQuiz ? (
            <div className="rounded-[20px] border border-ink-navy/8 bg-ink-navy/[0.02] p-10 text-center">
              <Flame size={24} className="mx-auto text-ink-navy/10 mb-3" />
              <p className="text-sm text-ink-navy/25 font-serif italic">Contenido viral generándose...</p>
            </div>
          ) : null}

          {/* Quiz */}
          {showQuiz && quizQuestions.length > 0 && (
            <div className="animate-fade-rise mt-4">
              <div className="text-center mb-4">
                <Brain size={18} className="mx-auto text-ink-navy/15 mb-1" />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/25">Quiz del Día</span>
              </div>
              {quizDone ? (
                <div className="rounded-[20px] border border-ink-navy/8 bg-white p-8 text-center shadow-md">
                  <div className="w-16 h-16 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
                  </div>
                  <h3 className="font-serif text-xl text-ink-navy mb-1">{score === quizQuestions.length ? "Perfecto." : score >= quizQuestions.length / 2 ? "Bien hecho." : "A mejorar."}</h3>
                  <p className="text-xs text-ink-navy/30 font-serif italic mb-5">{score}/{quizQuestions.length} correctas</p>
                  <button onClick={() => { setShowQuiz(false); setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); }}
                    className="bg-ink-navy text-mist-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors">Reintentar</button>
                </div>
              ) : (
                <div className="rounded-[20px] border border-ink-navy/8 bg-white overflow-hidden shadow-md">
                  <div className="h-1 bg-ink-navy/5"><div className="h-full bg-ink-navy transition-all duration-500" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} /></div>
                  <div className="p-5 md:p-6">
                    <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink-navy/20 block mb-3">{currentQ + 1} / {quizQuestions.length}</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
