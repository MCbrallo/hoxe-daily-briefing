"use client";

import { useState, useEffect } from "react";
import { ArrowRight, User, Bookmark, Clock, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
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

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 md:px-12 bg-mist-white max-w-4xl mx-auto">
      {/* Compact Header */}
      <header className="mb-8 border-b border-ink-navy/15 pb-5">
        <h1 className="font-serif text-4xl md:text-5xl text-ink-navy tracking-tight">Identity</h1>
        <p className="font-serif italic text-base text-ink-navy/50 mt-1">Manage algorithmic preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

        {/* Left: Auth Card */}
        <div className="md:col-span-7">
          <div className="border border-ink-navy/10 bg-warm-white/20 p-8 md:p-10 flex flex-col items-center text-center">
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
        </div>

        {/* Right: Stats */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ink-navy/5 flex items-center justify-center shrink-0">
              <Bookmark size={16} className="text-ink-navy/40" />
            </div>
            <div>
              <span className="text-2xl font-serif text-ink-navy">{session ? "0" : "--"}</span>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/35">Saved Contexts</p>
            </div>
          </div>

          <div className="border border-ink-navy/10 bg-warm-white/20 p-5 md:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ink-navy/5 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-ink-navy/40" />
            </div>
            <div>
              <span className="text-2xl font-serif text-ink-navy">{session ? "1" : "--"}</span>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink-navy/35">Days Explored</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
