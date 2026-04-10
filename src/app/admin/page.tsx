"use client";

import { useState, useEffect } from "react";
import { Shield, Calendar, Trash2, ChevronLeft, ChevronRight, Eye, Lock } from "lucide-react";
import { cn } from "@/utils/cn";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = "hoxe2026";

interface BriefingDay {
  id: string;
  date: string;
  day_of_week: string;
  briefing_items: any[];
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [days, setDays] = useState<BriefingDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError("");
      loadDays();
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const loadDays = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_briefings")
      .select("*, briefing_items (*)")
      .order("created_at", { ascending: true });
    if (data) {
      setDays(data);
      if (data.length > 0 && !selectedDay) setSelectedDay(data[0].date);
    }
    setLoading(false);
  };

  const deleteItem = async (itemId: string) => {
    await supabase.from("briefing_items").delete().eq("id", itemId);
    loadDays();
  };

  const currentDay = days.find(d => d.date === selectedDay);
  const todayStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  // Group items by category
  const grouped: Record<string, any[]> = {};
  if (currentDay?.briefing_items) {
    for (const item of currentDay.briefing_items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-mist-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-ink-navy/5 flex items-center justify-center mx-auto mb-4">
              <Shield size={24} className="text-ink-navy/40" />
            </div>
            <h1 className="font-serif text-3xl text-ink-navy mb-1">Admin</h1>
            <p className="text-sm text-ink-navy/30 font-serif italic">Panel de administración HOXE</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-3 rounded-xl border border-ink-navy/10 bg-white text-ink-navy text-sm focus:outline-none focus:border-ink-navy/30 transition-colors"
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-ink-navy text-mist-white py-3 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-slate-blue transition-colors"
            >
              Acceder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-white pt-6 pb-20 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 border-b border-ink-navy/10 pb-5">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-ink-navy/40" />
            <h1 className="font-serif text-2xl text-ink-navy">Admin Panel</h1>
          </div>
          <button onClick={() => setAuthed(false)} className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink-navy/30 hover:text-ink-navy transition-colors">
            Cerrar sesión
          </button>
        </header>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {days.map((day) => {
            const isToday = day.date === todayStr;
            const isFuture = days.indexOf(day) > days.findIndex(d => d.date === todayStr);
            const isSelected = day.date === selectedDay;
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.date)}
                className={cn(
                  "shrink-0 px-4 py-2.5 rounded-xl border text-left transition-all",
                  isSelected ? "bg-ink-navy text-white border-ink-navy" : "bg-white border-ink-navy/8 hover:border-ink-navy/20"
                )}
              >
                <span className={cn("text-[9px] font-bold tracking-[0.2em] uppercase block", isSelected ? "text-white/50" : "text-ink-navy/25")}>
                  {isToday ? "HOY" : isFuture ? "PRÓXIMO" : "PASADO"}
                </span>
                <span className={cn("text-sm font-bold", isSelected ? "text-white" : "text-ink-navy/70")}>{day.date}</span>
                <span className={cn("text-[10px] block", isSelected ? "text-white/40" : "text-ink-navy/20")}>{day.day_of_week}</span>
              </button>
            );
          })}
        </div>

        {/* Preview link */}
        {currentDay && (
          <div className="mb-6 flex items-center gap-2">
            <Eye size={14} className="text-ink-navy/25" />
            <a href={`/?date=${encodeURIComponent(currentDay.date)}`} target="_blank"
              className="text-xs text-ink-navy/40 hover:text-ink-navy underline underline-offset-2 transition-colors">
              Vista previa pública: /?date={currentDay.date}
            </a>
          </div>
        )}

        {/* Content grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-t-2 border-ink-navy rounded-full animate-spin mx-auto" />
          </div>
        ) : currentDay ? (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink-navy/35">{category}</span>
                  <span className="text-[10px] text-ink-navy/15 font-bold">{items.length}</span>
                  <div className="flex-1 h-[1px] bg-ink-navy/5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-ink-navy/6 bg-white group">
                      {item.image_url && (
                        <img src={item.image_url} referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover shrink-0" alt=""
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-ink-navy/20">{item.year}</span>
                        <p className="text-sm text-ink-navy font-medium truncate">{item.title}</p>
                        <p className="text-[11px] text-ink-navy/35 truncate">{item.short_explanation?.substring(0, 60)}...</p>
                      </div>
                      <button onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-center pt-4 border-t border-ink-navy/5">
              <span className="text-xs text-ink-navy/20">{currentDay.briefing_items?.length || 0} items totales para {currentDay.date}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={28} className="mx-auto text-ink-navy/10 mb-3" />
            <p className="text-sm text-ink-navy/25 font-serif italic">Selecciona un día para ver su contenido</p>
          </div>
        )}
      </div>
    </div>
  );
}
