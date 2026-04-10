"use client";

import { useState, useEffect } from "react";
import { Music, Flame, Film, Quote, Smartphone, Trophy, Brain, ChevronRight, Check, X, ChevronDown } from "lucide-react";
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
  { key: "viral_music",   icon: Music,      label: "Nº1 del Día",    accent: "text-purple-600",  bg: "bg-purple-500/5",  ring: "ring-purple-300/40" },
  { key: "viral_scandal", icon: Flame,      label: "El Escándalo",   accent: "text-red-600",     bg: "bg-red-500/5",     ring: "ring-red-300/40" },
  { key: "viral_movie",   icon: Film,       label: "Estreno del Día",accent: "text-amber-600",   bg: "bg-amber-500/5",   ring: "ring-amber-300/40" },
  { key: "viral_quote",   icon: Quote,      label: "In Memoriam",    accent: "text-slate-600",   bg: "bg-slate-500/5",   ring: "ring-slate-300/40" },
  { key: "viral_moment",  icon: Smartphone, label: "Momento Viral",  accent: "text-sky-600",     bg: "bg-sky-500/5",     ring: "ring-sky-300/40" },
  { key: "viral_record",  icon: Trophy,     label: "Récord Roto",    accent: "text-emerald-600", bg: "bg-emerald-500/5", ring: "ring-emerald-300/40" },
];

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

function generateQuiz(items: ViralItem[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usable = items.filter(i => i.year && i.year !== "Unknown");

  for (const item of usable.slice(0, 4)) {
    const correctYear = parseInt(item.year);
    if (isNaN(correctYear)) continue;

    const offsets = [-12, -5, 7, 15, -20, 10, 3, -8].sort(() => 0.5 - Math.random()).slice(0, 3);
    const wrongYears = offsets.map(o => correctYear + o).filter(y => y > 0 && y !== correctYear);
    const options = [String(correctYear), ...wrongYears.map(String)].slice(0, 4).sort(() => 0.5 - Math.random());

    questions.push({
      question: `¿En qué año ocurrió: "${item.title}"?`,
      options,
      correctIndex: options.indexOf(String(correctYear)),
    });
  }
  return questions.slice(0, 4);
}

export default function ViralPage() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
    if (idx === quizQuestions[currentQ].correctIndex) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= quizQuestions.length) { setQuizDone(true); }
    else { setCurrentQ(q => q + 1); setSelectedAnswer(null); setAnswered(false); }
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
      <header className="px-6 md:px-16 pt-8 pb-10 md:pb-14">
        <div className="max-w-5xl mx-auto">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-ink-navy/30 block mb-3">{dateLabel}</span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-ink-navy tracking-tight leading-[0.9]">
            Viral
          </h1>
          <div className="w-12 h-[2px] bg-ink-navy/15 mt-5 mb-3" />
          <p className="text-sm md:text-base text-ink-navy/45 font-serif italic max-w-lg">
            Lo que rompió el mundo este día. Canciones, escándalos, estrenos y momentos que cambiaron la conversación.
          </p>
        </div>
      </header>

      {/* ─── SCROLLABLE CARDS ─── */}
      <div className="max-w-5xl mx-auto px-6 md:px-16">
        <div className="flex flex-col gap-5">
          {VIRAL_SECTIONS.map((section) => {
            const sectionItems = items.filter(i => i.category === section.key);
            const item = sectionItems[0];
            const Icon = section.icon;
            const isExpanded = expandedCard === section.key;

            return (
              <div
                key={section.key}
                className={cn(
                  "group border border-ink-navy/8 rounded-xl overflow-hidden transition-all duration-500",
                  item ? "hover:border-ink-navy/15 hover:shadow-md cursor-pointer" : "opacity-50"
                )}
              >
                {/* Card Header — always visible */}
                <button
                  onClick={() => item && setExpandedCard(isExpanded ? null : section.key)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", section.bg)}>
                    <Icon size={18} className={section.accent} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-[10px] font-bold tracking-[0.2em] uppercase block", section.accent)}>
                      {section.label}
                    </span>
                    {item ? (
                      <span className="text-base md:text-lg font-serif text-ink-navy leading-snug block mt-0.5 truncate">
                        {item.title}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-navy/30 font-serif italic block mt-0.5">
                        Sin contenido disponible
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item?.year && item.year !== "Unknown" && (
                      <span className="text-xs font-serif italic text-ink-navy/30 hidden md:block">{item.year}</span>
                    )}
                    {item && (
                      <ChevronDown
                        size={16}
                        className={cn("text-ink-navy/20 transition-transform duration-300", isExpanded && "rotate-180")}
                      />
                    )}
                  </div>
                </button>

                {/* Card Body — expandable */}
                {item && (
                  <div className={cn(
                    "grid transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden min-h-0">
                      <div className="px-5 md:px-6 pb-6 border-t border-ink-navy/5 pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          <div className={cn("flex flex-col", item.image_url ? "md:col-span-7" : "md:col-span-12")}>
                            {item.year && item.year !== "Unknown" && (
                              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink-navy/25 mb-2 md:hidden">{item.year}</span>
                            )}
                            <p className="text-sm md:text-base text-ink-navy/70 leading-relaxed mb-4">
                              {item.short_explanation}
                            </p>
                            {item.why_it_matters && (
                              <p className="text-xs md:text-sm text-ink-navy/50 font-serif italic leading-relaxed line-clamp-4">
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
                                className="w-full h-44 md:h-56 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── QUIZ ─── */}
        <section className="mt-14 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-ink-navy/5 flex items-center justify-center">
              <Brain size={16} className="text-ink-navy/40" />
            </div>
            <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase text-ink-navy/50">
              Quiz del Día
            </h2>
            <div className="flex-1 h-[1px] bg-ink-navy/6 ml-2" />
          </div>

          {quizQuestions.length === 0 ? (
            <div className="border border-ink-navy/8 rounded-xl p-10 text-center">
              <Brain size={28} className="mx-auto text-ink-navy/15 mb-3" />
              <p className="text-sm text-ink-navy/30 font-serif italic">El quiz se generará cuando haya contenido disponible.</p>
            </div>
          ) : quizDone ? (
            <div className="border border-ink-navy/8 rounded-xl p-8 md:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-ink-navy/5 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-serif font-bold text-ink-navy">{score}/{quizQuestions.length}</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-ink-navy mb-2">
                {score === quizQuestions.length ? "Perfecto." : score >= quizQuestions.length / 2 ? "Bien hecho." : "Sigue intentando."}
              </h3>
              <p className="text-sm text-ink-navy/40 font-serif italic mb-6">
                {score === quizQuestions.length ? "Dominas la cultura de este día." : `Acertaste ${score} de ${quizQuestions.length}.`}
              </p>
              <button
                onClick={() => { setCurrentQ(0); setScore(0); setQuizDone(false); setSelectedAnswer(null); setAnswered(false); }}
                className="bg-ink-navy text-mist-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="border border-ink-navy/8 rounded-xl overflow-hidden">
              <div className="h-1 bg-ink-navy/5">
                <div className="h-full bg-ink-navy transition-all duration-500" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} />
              </div>
              <div className="p-6 md:p-10">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/25 block mb-4">
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
                          !answered && "hover:border-ink-navy/20 hover:bg-ink-navy/[0.02] cursor-pointer",
                          answered && isCorrect && "border-emerald-400 bg-emerald-50/50",
                          answered && isSelected && !isCorrect && "border-red-300 bg-red-50/50",
                          !answered && "border-ink-navy/8",
                          answered && !isCorrect && !isSelected && "opacity-40"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-sm font-bold transition-all",
                          answered && isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "",
                          answered && isSelected && !isCorrect ? "bg-red-400 border-red-400 text-white" : "",
                          !answered ? "border-ink-navy/15 text-ink-navy/30" : ""
                        )}>
                          {answered && isCorrect ? <Check size={14} /> :
                           answered && isSelected && !isCorrect ? <X size={14} /> :
                           String.fromCharCode(65 + idx)}
                        </span>
                        <span className={cn(
                          "font-bold text-sm tracking-wide",
                          answered && isCorrect ? "text-emerald-700" : "text-ink-navy/60"
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
