"use client";

import { useState, useEffect } from "react";
import { Music, Flame, Film, Quote, Smartphone, Trophy, Brain, ChevronRight, Check, X, ArrowRight } from "lucide-react";
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

const VIRAL_META: Record<string, { icon: any; label: string; accent: string; bg: string }> = {
  viral_music:   { icon: Music,      label: "Nº1 del Día",     accent: "text-purple-600",  bg: "bg-purple-500" },
  viral_scandal: { icon: Flame,      label: "El Escándalo",    accent: "text-red-600",     bg: "bg-red-500" },
  viral_movie:   { icon: Film,       label: "Estreno del Día", accent: "text-amber-600",   bg: "bg-amber-500" },
  viral_quote:   { icon: Quote,      label: "In Memoriam",     accent: "text-slate-600",   bg: "bg-slate-500" },
  viral_moment:  { icon: Smartphone, label: "Momento Viral",   accent: "text-sky-600",     bg: "bg-sky-500" },
  viral_record:  { icon: Trophy,     label: "Récord Roto",     accent: "text-emerald-600", bg: "bg-emerald-500" },
};

interface QuizQuestion { question: string; options: string[]; correctIndex: number; }

function generateQuiz(items: ViralItem[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usable = items.filter(i => i.year && i.year !== "Unknown");
  for (const item of usable.slice(0, 4)) {
    const y = parseInt(item.year);
    if (isNaN(y)) continue;
    const offsets = [-12, -5, 7, 15, -20, 10, 3, -8].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [String(y), ...offsets.map(o => String(y + o)).filter(s => s !== String(y) && parseInt(s) > 0)].slice(0, 4).sort(() => 0.5 - Math.random());
    questions.push({ question: `¿En qué año: "${item.title}"?`, options, correctIndex: options.indexOf(String(y)) });
  }
  return questions.slice(0, 4);
}

export default function ViralPage() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ViralItem[]>([]);
  const [allItems, setAllItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("");
  const [currentCard, setCurrentCard] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Quiz
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
        const viralItems = rows[0].briefing_items.filter((i: any) => i.category.startsWith("viral_"));
        setItems(viralItems);
        setAllItems(rows[0].briefing_items);
        setQuizQuestions(generateQuiz(viralItems.length > 0 ? viralItems : rows[0].briefing_items));
      }
      setLoading(false);
    }
    load();
  }, [language]);

  const nextCard = () => {
    if (currentCard >= items.length - 1) {
      setShowQuiz(true);
      return;
    }
    setExiting(true);
    setTimeout(() => { setCurrentCard(c => c + 1); setExiting(false); }, 300);
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === quizQuestions[currentQ].correctIndex) setScore(s => s + 1);
  };
  const nextQuestion = () => {
    if (currentQ + 1 >= quizQuestions.length) setQuizDone(true);
    else { setCurrentQ(q => q + 1); setSelectedAnswer(null); setAnswered(false); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-mist-white"><div className="w-6 h-6 border-t-2 border-ink-navy rounded-full animate-spin" /></div>;
  }

  const card = items[currentCard];
  const meta = card ? VIRAL_META[card.category] : null;

  return (
    <div className="min-h-screen bg-mist-white pt-14 md:pt-20 pb-28 md:pb-16 flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-16 pb-6">
        <div className="max-w-lg mx-auto">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-ink-navy/25 block mb-2">{dateLabel}</span>
          <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight leading-[0.9]">Viral</h1>
          <div className="w-10 h-[1.5px] bg-ink-navy/12 mt-3" />
        </div>
      </header>

      {/* Tinder Card Stack */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-16">
        <div className="w-full max-w-lg relative" style={{ minHeight: '420px' }}>

          {!showQuiz && items.length > 0 && card && meta ? (
            <>
              {/* Card counter */}
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/25">
                  {currentCard + 1} / {items.length}
                </span>
              </div>

              {/* Stacked cards behind */}
              {items.slice(currentCard + 1, currentCard + 3).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 mx-auto border border-ink-navy/5 rounded-2xl bg-white shadow-sm"
                  style={{
                    top: `${(i + 1) * 8}px`,
                    width: `calc(100% - ${(i + 1) * 16}px)`,
                    height: '400px',
                    zIndex: 10 - i,
                    opacity: 1 - (i + 1) * 0.25,
                  }}
                />
              ))}

              {/* Active card */}
              <div
                className={cn(
                  "relative z-20 border border-ink-navy/8 rounded-2xl bg-white shadow-lg overflow-hidden transition-all duration-300",
                  exiting && "opacity-0 translate-x-[120%] rotate-6 scale-95"
                )}
              >
                {/* Card image */}
                {card.image_url ? (
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <img
                      src={card.image_url}
                      alt={card.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-white/90")}>
                        <meta.icon size={14} className={meta.accent} strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90">{meta.label}</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 pt-5 flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", meta.bg + "/10")}>
                      <meta.icon size={16} className={meta.accent} strokeWidth={2} />
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-[0.2em] uppercase", meta.accent)}>{meta.label}</span>
                  </div>
                )}

                {/* Card content */}
                <div className="p-5 md:p-6">
                  {card.year && card.year !== "Unknown" && (
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink-navy/20 block mb-1.5">{card.year}</span>
                  )}
                  <h2 className="font-serif text-xl md:text-2xl text-ink-navy leading-snug mb-3">{card.title}</h2>
                  <p className="text-sm text-ink-navy/60 leading-relaxed mb-3">{card.short_explanation}</p>
                  {card.why_it_matters && (
                    <p className="text-xs text-ink-navy/40 font-serif italic leading-relaxed line-clamp-3">{card.why_it_matters}</p>
                  )}

                  {card.metadata_spotify_track_id && (
                    <div className="mt-4">
                      <iframe src={`https://open.spotify.com/embed/track/${card.metadata_spotify_track_id}?theme=0`} width="100%" height="80" frameBorder="0" allow="encrypted-media" className="rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Next button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={nextCard}
                    className="w-full flex items-center justify-center gap-2 bg-ink-navy text-mist-white py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors"
                  >
                    {currentCard >= items.length - 1 ? "Ir al Quiz" : "Siguiente"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </>
          ) : !showQuiz && items.length === 0 ? (
            <div className="border border-ink-navy/8 rounded-2xl p-10 text-center bg-white">
              <Flame size={28} className="mx-auto text-ink-navy/15 mb-3" />
              <p className="text-sm text-ink-navy/30 font-serif italic">Contenido viral generándose...</p>
            </div>
          ) : null}

          {/* Quiz */}
          {showQuiz && quizQuestions.length > 0 && (
            <div className="relative z-20">
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/25">Quiz del Día</span>
              </div>

              {quizDone ? (
                <div className="border border-ink-navy/8 rounded-2xl p-8 md:p-10 text-center bg-white shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
                  </div>
                  <h3 className="font-serif text-xl text-ink-navy mb-1">
                    {score === quizQuestions.length ? "Perfecto." : score >= quizQuestions.length / 2 ? "Bien hecho." : "Sigue intentando."}
                  </h3>
                  <p className="text-xs text-ink-navy/35 font-serif italic mb-5">{score}/{quizQuestions.length} correctas</p>
                  <button
                    onClick={() => { setCurrentCard(0); setShowQuiz(false); setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); setExiting(false); }}
                    className="bg-ink-navy text-mist-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="border border-ink-navy/8 rounded-2xl overflow-hidden bg-white shadow-lg">
                  <div className="h-1 bg-ink-navy/5"><div className="h-full bg-ink-navy transition-all duration-500" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} /></div>
                  <div className="p-5 md:p-8">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/20 block mb-3">
                      {currentQ + 1} / {quizQuestions.length}
                    </span>
                    <h3 className="font-serif text-base md:text-lg text-ink-navy mb-6 leading-snug">{quizQuestions[currentQ].question}</h3>
                    <div className="flex flex-col gap-2.5">
                      {quizQuestions[currentQ].options.map((opt, idx) => {
                        const isCorrect = idx === quizQuestions[currentQ].correctIndex;
                        const isSelected = selectedAnswer === idx;
                        return (
                          <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                            className={cn(
                              "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-300",
                              !answered && "hover:border-ink-navy/15 cursor-pointer border-ink-navy/8",
                              answered && isCorrect && "border-emerald-400 bg-emerald-50/50",
                              answered && isSelected && !isCorrect && "border-red-300 bg-red-50/50",
                              answered && !isCorrect && !isSelected && "opacity-35"
                            )}>
                            <span className={cn(
                              "w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold",
                              answered && isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "",
                              answered && isSelected && !isCorrect ? "bg-red-400 border-red-400 text-white" : "",
                              !answered ? "border-ink-navy/12 text-ink-navy/25" : ""
                            )}>
                              {answered && isCorrect ? <Check size={12} /> : answered && isSelected && !isCorrect ? <X size={12} /> : String.fromCharCode(65 + idx)}
                            </span>
                            <span className={cn("font-bold text-sm", answered && isCorrect ? "text-emerald-700" : "text-ink-navy/55")}>{opt}</span>
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
