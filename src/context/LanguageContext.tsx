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
    window.location.reload();
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
