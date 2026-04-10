"use client";

import { useState, useEffect, useCallback } from "react";
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

const VIRAL_SECTIONS = [
  { key: "viral_music",    icon: Music,      emoji: "🎵", label: "Nº1 del Día",      color: "from-purple-500/10 to-fuchsia-500/10", accent: "text-purple-700",  border: "border-purple-200" },
  { key: "viral_scandal",  icon: Flame,      emoji: "🔥", label: "El Escándalo",      color: "from-red-500/10 to-orange-500/10",     accent: "text-red-700",     border: "border-red-200" },
  { key: "viral_movie",    icon: Film,       emoji: "🎬", label: "Estreno del Día",   color: "from-amber-500/10 to-yellow-500/10",   accent: "text-amber-700",   border: "border-amber-200" },
  { key: "viral_quote",    icon: Quote,      emoji: "💀", label: "Última Frase",      color: "from-slate-500/10 to-zinc-500/10",     accent: "text-slate-700",   border: "border-slate-300" },
  { key: "viral_moment",   icon: Smartphone, emoji: "📱", label: "Momento Viral",     color: "from-sky-500/10 to-cyan-500/10",       accent: "text-sky-700",     border: "border-sky-200" },
  { key: "viral_record",   icon: Trophy,     emoji: "🏆", label: "Récord Roto",       color: "from-emerald-500/10 to-teal-500/10",   accent: "text-emerald-700", border: "border-emerald-200" },
];

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

function generateQuiz(items: ViralItem[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usableItems = items.filter(i => i.year && i.year !== "Unknown");

  for (const item of usableItems.slice(0, 4)) {
    const correctYear = parseInt(item.year);
    if (isNaN(correctYear)) continue;

    const offsets = [-12, -5, 7, 15, -20, 10, 3, -8].sort(() => 0.5 - Math.random()).slice(0, 3);
    const wrongYears = offsets.map(o => correctYear + o).filter(y => y > 0 && y !== correctYear);
    
    const options = [String(correctYear), ...wrongYears.map(String)].slice(0, 4).sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(String(correctYear));

    questions.push({
      question: `¿En qué año ocurrió: "${item.title}"?`,
      options,
      correctIndex,
    });
  }

  return questions.slice(0, 4);
}

export default function ViralPage() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("");

  // Quiz state
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

      // Safe query — no language filter, no .single()
      const { data: rows } = await supabase
        .from("daily_briefings")
        .select("*, briefing_items (*)")
        .eq("date", todayStr)
        .limit(1);

      if (rows && rows.length > 0 && rows[0].briefing_items) {
        const allDbItems = rows[0].briefing_items;
        const viralItems = allDbItems.filter((i: any) => i.category.startsWith("viral_"));
        setItems(viralItems);
        setQuizQuestions(generateQuiz(viralItems.length > 0 ? viralItems : allDbItems));
      }
      setLoading(false);
    }
    load();
  }, [language]);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === quizQuestions[currentQ].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= quizQuestions.length) {
      setQuizDone(true);
    } else {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-white">
        <div className="w-6 h-6 border-t-2 border-ink-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-white pt-20 md:pt-24 pb-28 md:pb-16">
      {/* ─── HERO ─── */}
      <header className="relative overflow-hidden px-6 md:px-16 pt-10 pb-14 md:pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.04] via-purple-500/[0.03] to-amber-500/[0.04]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-fuchsia-400/[0.04] blur-[120px] -top-48 -right-24 animate-[drift_20s_ease-in-out_infinite]" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-400/[0.05] blur-[100px] bottom-0 -left-32 animate-[drift_25s_ease-in-out_infinite_reverse]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Flame size={16} className="text-red-500" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-ink-navy/40">{dateLabel}</span>
          </div>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-ink-navy tracking-tight leading-[0.85]">
            Viral
          </h1>
          <p className="mt-5 text-sm md:text-base text-ink-navy/50 font-serif italic max-w-md">
            Lo que rompió el mundo este día. Canciones, escándalos, estrenos, récords y momentos que cambiaron la conversación.
          </p>
        </div>
      </header>

      {/* ─── CONTENT SECTIONS ─── */}
      <div className="max-w-5xl mx-auto px-6 md:px-16">
        {VIRAL_SECTIONS.map((section) => {
          const sectionItems = items.filter(i => i.category === section.key);
          const item = sectionItems[0]; // One item per section

          return (
            <section key={section.key} className="mb-12 md:mb-16">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{section.emoji}</span>
                <h2 className={cn("text-[11px] font-bold tracking-[0.25em] uppercase", section.accent)}>
                  {section.label}
                </h2>
                <div className="flex-1 h-[1px] bg-ink-navy/8 ml-2" />
              </div>

              {item ? (
                <div className={cn(
                  "border rounded-lg overflow-hidden transition-all hover:shadow-lg",
                  section.border
                )}>
                  <div className={cn("bg-gradient-to-r p-6 md:p-8", section.color)}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className={cn("flex flex-col justify-center", item.image_url ? "md:col-span-7" : "md:col-span-12")}>
                        {item.year && item.year !== "Unknown" && (
                          <span className="text-xs font-bold tracking-[0.2em] uppercase text-ink-navy/30 mb-2">{item.year}</span>
                        )}
                        <h3 className="font-serif text-xl md:text-2xl text-ink-navy leading-snug mb-3">
                          {item.title}
                        </h3>
                        <p className="text-sm md:text-base text-ink-navy/70 leading-relaxed">
                          {item.short_explanation}
                        </p>
                        {item.why_it_matters && (
                          <p className="text-xs md:text-sm text-ink-navy/50 font-serif italic mt-4 leading-relaxed line-clamp-3">
                            {item.why_it_matters}
                          </p>
                        )}
                        {item.metadata_spotify_track_id && (
                          <div className="mt-4">
                            <iframe 
                              src={`https://open.spotify.com/embed/track/${item.metadata_spotify_track_id}?theme=0`}
                              width="100%" height="80" frameBorder="0" allow="encrypted-media"
                              className="rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      {item.image_url && (
                        <div className="md:col-span-5">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            className="w-full h-48 md:h-full object-cover rounded-lg filter hover:grayscale-0 transition-all duration-700" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn("border rounded-lg p-8 text-center", section.border)}>
                  <div className={cn("bg-gradient-to-r rounded-lg p-8", section.color)}>
                    <span className="text-4xl block mb-3">{section.emoji}</span>
                    <p className="text-sm text-ink-navy/40 font-serif italic">
                      Contenido generándose... Disponible mañana a las 12:00 UTC.
                    </p>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* ─── QUIZ ─── */}
        <section className="mt-16 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <Brain size={20} className="text-ink-navy" />
            <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase text-ink-navy/60">
              Quiz del Día
            </h2>
            <div className="flex-1 h-[1px] bg-ink-navy/8 ml-2" />
          </div>

          {quizQuestions.length === 0 ? (
            <div className="border border-ink-navy/10 rounded-lg p-10 text-center bg-gradient-to-br from-ink-navy/[0.02] to-slate-blue/[0.03]">
              <Brain size={32} className="mx-auto text-ink-navy/20 mb-3" />
              <p className="text-sm text-ink-navy/40 font-serif italic">El quiz se generará automáticamente cuando haya contenido disponible.</p>
            </div>
          ) : quizDone ? (
            /* ─── RESULTS ─── */
            <div className="border border-ink-navy/10 rounded-xl p-8 md:p-12 text-center bg-gradient-to-br from-emerald-500/[0.04] to-sky-500/[0.04]">
              <div className="w-20 h-20 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-ink-navy mb-2">
                {score === quizQuestions.length ? "¡Perfecto!" : score >= quizQuestions.length / 2 ? "¡Bien hecho!" : "¡Sigue intentando!"}
              </h3>
              <p className="text-sm text-ink-navy/50 font-serif italic mb-6">
                {score === quizQuestions.length 
                  ? "Dominas la cultura de este día."
                  : `Acertaste ${score} de ${quizQuestions.length} preguntas.`
                }
              </p>
              <button 
                onClick={() => { setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); }}
                className="bg-ink-navy text-mist-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            /* ─── QUESTION CARD ─── */
            <div className="border border-ink-navy/10 rounded-xl overflow-hidden bg-gradient-to-br from-ink-navy/[0.01] to-purple-500/[0.02]">
              {/* Progress */}
              <div className="h-1 bg-ink-navy/5">
                <div 
                  className="h-full bg-ink-navy transition-all duration-500" 
                  style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} 
                />
              </div>

              <div className="p-6 md:p-10">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/30 block mb-4">
                  Pregunta {currentQ + 1} de {quizQuestions.length}
                </span>
                <h3 className="font-serif text-lg md:text-xl text-ink-navy mb-8 leading-snug">
                  {quizQuestions[currentQ].question}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quizQuestions[currentQ].options.map((option, idx) => {
                    const isCorrect = idx === quizQuestions[currentQ].correctIndex;
                    const isSelected = selectedAnswer === idx;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={answered}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border text-left transition-all duration-300",
                          !answered && "hover:border-ink-navy/30 hover:bg-ink-navy/[0.02] cursor-pointer",
                          answered && isCorrect && "border-emerald-500 bg-emerald-50",
                          answered && isSelected && !isCorrect && "border-red-400 bg-red-50",
                          !answered && "border-ink-navy/10",
                          answered && !isCorrect && !isSelected && "opacity-50"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-sm font-bold transition-all",
                          answered && isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "",
                          answered && isSelected && !isCorrect ? "bg-red-400 border-red-400 text-white" : "",
                          !answered ? "border-ink-navy/20 text-ink-navy/40" : ""
                        )}>
                          {answered && isCorrect ? <Check size={14} /> : 
                           answered && isSelected && !isCorrect ? <X size={14} /> : 
                           String.fromCharCode(65 + idx)}
                        </span>
                        <span className={cn(
                          "font-bold text-sm tracking-wide",
                          answered && isCorrect ? "text-emerald-700" : "text-ink-navy/70"
                        )}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className="mt-6 flex justify-end animate-fade-rise">
                    <button
                      onClick={nextQuestion}
                      className="flex items-center gap-2 bg-ink-navy text-mist-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue transition-colors"
                    >
                      {currentQ + 1 >= quizQuestions.length ? "Ver resultado" : "Siguiente"}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
