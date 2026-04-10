"use client";

import { useState, useEffect } from "react";
import { ArrowRight, User, Bookmark, Clock, LogOut, Settings2, Bell, Shield, Languages, Flame, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

export default function ProfilePage() {
  const { language, setLanguage, disabledCategories, toggleCategory, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [streak, setStreak] = useState(1);
  const [points, setPoints] = useState(10);

  useEffect(() => {
    try {
      const lastLoginStr = localStorage.getItem("hoxe_last_login");
      const currentStreak = parseInt(localStorage.getItem("hoxe_streak") || "0", 10);
      const currentPoints = parseInt(localStorage.getItem("hoxe_points") || "0", 10);
      const today = new Date().toDateString();

      if (lastLoginStr !== today) {
        const lastLogin = new Date(lastLoginStr || 0);
        const now = new Date(today);
        const diffDays = Math.round(Math.abs((now.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24)));
        
        let nextStreak = currentStreak;
        if (diffDays === 1) nextStreak = currentStreak + 1;
        else if (diffDays > 1) nextStreak = 1;

        const nextPoints = currentPoints + 10;

        localStorage.setItem("hoxe_streak", nextStreak.toString());
        localStorage.setItem("hoxe_points", nextPoints.toString());
        localStorage.setItem("hoxe_last_login", today);
        
        setStreak(nextStreak);
        setPoints(nextPoints);
      } else {
        setStreak(currentStreak || 1);
        setPoints(currentPoints || 10);
      }
    } catch(e) {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/profile" }
    });

    if (error) {
      alert("Error: " + error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const EDITORIAL_CATS = ["history", "science", "warfare", "culture", "people", "space", "sports", "music"];

  return (
    <div className="min-h-screen pt-16 md:pt-20 pb-24 px-6 md:px-12 bg-mist-white max-w-4xl mx-auto">
      {/* Compact Header */}
      <header className="mb-8 border-b border-ink-navy/15 pb-5">
        <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight">{t("Profile")} & {t("Settings")}</h1>
        <p className="font-serif italic text-base text-ink-navy/50 mt-1">Manage identity and algorithmic preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

        {/* Left Column: Auth & Preferences */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border border-ink-navy/15 bg-warm-white/40 flex items-center justify-center mb-5">
              <User size={26} className="text-ink-navy/30" />
            </div>
            
            {loading ? (
              <div className="w-5 h-5 border-t-2 border-ink-navy rounded-full animate-spin my-8"></div>
            ) : session ? (
              <>
                <p className="text-ink-navy text-sm font-serif italic mb-2">Authenticated terminal</p>
                <p className="text-ink-navy text-base font-bold mb-6 font-sans">{session.user.email}</p>
                <button onClick={handleLogout} className="w-full max-w-xs bg-ink-navy text-mist-white px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue transition-colors focus:outline-none flex justify-center items-center gap-2.5">
                  <LogOut size={14} /> Terminate Connection
                </button>
              </>
            ) : status === "success" ? (
              <>
                <p className="text-[#14532D] text-sm font-serif italic mb-6 max-w-xs leading-relaxed">
                  Verification protocol dispatched. Check your inbox to securely establish identity.
                </p>
              </>
            ) : (
              <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
                <p className="text-ink-navy/60 text-sm font-serif italic mb-8 max-w-xs leading-relaxed">
                  Encrypt preferences and maintain your saved intellectual property across devices.
                </p>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@directive.com" 
                  required
                  className="w-full max-w-xs bg-transparent border-b border-ink-navy/30 pb-2 mb-6 text-center text-ink-navy font-serif outline-none focus:border-ink-navy transition-colors placeholder:text-ink-navy/20"
                />
                <button type="submit" disabled={status === "loading"} className="w-full max-w-xs bg-ink-navy text-mist-white px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-slate-blue transition-colors focus:outline-none flex justify-center items-center gap-2.5 disabled:opacity-50">
                  {status === "loading" ? "Initializing..." : "Request Access"} <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 mb-3 px-4">
              Content Preferences
            </h2>
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white overflow-hidden">
              {EDITORIAL_CATS.map((cat, idx) => {
                const isActive = !disabledCategories.includes(cat);
                return (
                  <div key={cat} className={cn("flex items-center justify-between p-4 px-5", idx !== EDITORIAL_CATS.length - 1 ? "border-b border-ink-navy/5" : "")}>
                    <span className="text-sm font-medium text-ink-navy capitalize tracking-wide">{cat}</span>
                    <button 
                      onClick={() => toggleCategory(cat)}
                      className={cn("w-11 h-6 rounded-full relative transition-colors duration-300", isActive ? "bg-emerald-500" : "bg-ink-navy/15")}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300", isActive ? "left-6" : "left-1")}></div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 mb-3 px-4 mt-6">
              Language / Idioma
            </h2>
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white overflow-hidden p-2 flex gap-2">
              {[
                { id: "en", label: "Eng" },
                { id: "es", label: "Esp" },
                { id: "gl", label: "Gal" }
              ].map((lang) => (
                <button 
                  key={lang.id} 
                  onClick={() => setLanguage(lang.id as any)}
                  className={cn(
                    "flex-1 py-3 text-xs md:text-sm font-bold tracking-[0.1em] uppercase transition-all rounded-2xl",
                    language === lang.id 
                      ? "bg-ink-navy text-white shadow-md" 
                      : "text-ink-navy/40 hover:bg-ink-navy/5"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Stats & Secondary */}
        <div className="md:col-span-5 flex flex-col gap-6">
          
          <div className="flex flex-col gap-4">
            
            <div className="flex gap-4">
              <div className="flex-1 bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white p-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div>
                  <span className="text-3xl font-serif text-ink-navy leading-none mb-1 block relative z-10">{streak}</span>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/40 relative z-10">Day Streak</p>
                </div>
                <div className="absolute bottom-4 right-4 text-orange-500/80">
                  <Flame size={24} strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex-1 bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white p-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div>
                  <span className="text-3xl font-serif text-ink-navy leading-none mb-1 block relative z-10">{points}</span>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/40 relative z-10">Total Points</p>
                </div>
                <div className="absolute bottom-4 right-4 text-amber-500/80">
                  <Star size={24} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white p-5 md:p-6 flex items-center justify-between">
              <div>
                <span className="text-3xl font-serif text-ink-navy leading-none mb-1 block">{session ? "0" : "--"}</span>
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/35">Saved Contexts</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-blue/10 flex items-center justify-center shrink-0">
                <Bookmark size={20} className="text-slate-blue" strokeWidth={2} />
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-navy/40 mb-3 px-4 mt-2">
              Application
            </h2>
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_4px_24px_-10px_rgba(27,46,75,0.05)] border border-white overflow-hidden flex flex-col">
              <button className="text-left text-xs font-bold uppercase tracking-widest text-ink-navy/70 hover:bg-ink-navy/5 transition-colors p-5 border-b border-ink-navy/5 flex items-center justify-between group">
                Privacy Policy <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform opacity-50" />
              </button>
              <button className="text-left text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors p-5 flex items-center justify-between group">
                Delete Account <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform opacity-30" />
              </button>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
