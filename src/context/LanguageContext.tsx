"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "es" | "gl";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  disabledCategories: string[];
  toggleCategory: (cat: string) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    Today: "Today",
    Viral: "Viral",
    Archive: "Archive",
    Saved: "Saved",
    Settings: "Settings",
    Profile: "Profile",
    ReadContext: "Read Context",
    CloseContext: "Close Context",
    Pending: "& Pending",
    ThePast: "The Past,",
    Present: "Present,",
    By: "Photo by",
    AdminPreview: "Admin Preview",
    QuizTitle: "Quiz of the Day",
    QuizRetry: "Try Again",
    ObTitle1: "The context of today.",
    ObText1: "Every morning, HOXE resurfaces the exact events that shook the world on this specific date in history.",
    ObTitle2: "Curate your feed.",
    ObText2: "Turn off warfare, boost science, or mute history. From Settings you completely govern your editorial focus.",
    ObTitle3: "Pulse of the internet.",
    ObText3: "The Viral Tab distills the definitive cultural moments, breaking records, and scandals of the day into a swipeable deck.",
    ObEnter: "ENTER HOXE",
    ObNext: "NEXT",
    SelectLang: "Choose your language",
    SelectLangDesc: "Select your preferred context language.",
    ScrollDown: "Scroll down to explore"
  },
  es: {
    Today: "Hoy",
    Viral: "Viral",
    Archive: "Archivo",
    Saved: "Guardados",
    Settings: "Ajustes",
    Profile: "Perfil",
    ReadContext: "Leer Contexto",
    CloseContext: "Cerrar Contexto",
    Pending: "& Pendiente",
    ThePast: "El Pasado,",
    Present: "Presente,",
    By: "Foto de",
    AdminPreview: "Vista Admin",
    QuizTitle: "Quiz del Día",
    QuizRetry: "Reintentar",
    ObTitle1: "El contexto de hoy.",
    ObText1: "Cada mañana, HOXE rescata los eventos exactos que sacudieron al mundo en esta fecha específica de la historia.",
    ObTitle2: "Curar tu contenido.",
    ObText2: "Apaga la guerra, impulsa la ciencia o silencia la historia. Desde Ajustes tú gobiernas por completo tu enfoque editorial.",
    ObTitle3: "El pulso de internet.",
    ObText3: "La pestaña Viral destila los momentos culturales definitivos, récords y escándalos del día en una baraja deslizable.",
    ObEnter: "ENTRAR A HOXE",
    ObNext: "SIGUIENTE",
    SelectLang: "Elige tu idioma",
    SelectLangDesc: "Selecciona tu idioma preferido para el contexto.",
    ScrollDown: "Desliza para explorar"
  },
  gl: {
    Today: "Hoxe",
    Viral: "Viral",
    Archive: "Arquivo",
    Saved: "Gardados",
    Settings: "Axustes",
    Profile: "Perfil",
    ReadContext: "Ler Contexto",
    CloseContext: "Pechar Contexto",
    Pending: "& Pendente",
    ThePast: "O Pasado,",
    Present: "Presente,",
    By: "Foto por",
    AdminPreview: "Vista Admin",
    QuizTitle: "Quiz do Día",
    QuizRetry: "Reintentar",
    ObTitle1: "O contexto de hoxe.",
    ObText1: "Cada mañá, HOXE rescata os eventos exactos que sacudiron o mundo nesta data específica da historia.",
    ObTitle2: "O teu contido.",
    ObText2: "Apaga a guerra, impulsa a ciencia ou silencia a historia. Desde Axustes ti gobernas por completo o teu enfoque.",
    ObTitle3: "O pulso da internet.",
    ObText3: "A lapela Viral destila os momentos culturais definitivos, récords e escándalos do día nunha baralla.",
    ObEnter: "ENTRAR A HOXE",
    ObNext: "SEGUINTE",
    SelectLang: "Escolle o teu idioma",
    SelectLangDesc: "Selecciona o teu idioma preferido para o contexto.",
    ScrollDown: "Desliza para explorar"
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  disabledCategories: [],
  toggleCategory: () => {},
  t: (key: string) => key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>("en");
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hoxe_lang") as Language;
    if (saved && (saved === "en" || saved === "es" || saved === "gl")) setLangState(saved);
    
    const savedCats = localStorage.getItem("hoxe_disabled_cats");
    if (savedCats) setDisabledCategories(JSON.parse(savedCats));
    
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem("hoxe_lang", lang);
  };

  const toggleCategory = (cat: string) => {
    setDisabledCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      localStorage.setItem("hoxe_disabled_cats", JSON.stringify(next));
      return next;
    });
  };

  const t = (key: string) => {
    if (!mounted) return key;
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, disabledCategories, toggleCategory, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
