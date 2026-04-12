import { notFound } from 'next/navigation';
import { Shield, Database, Calendar, Trash2, Zap, Fingerprint } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function deleteItem(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  await supabase.from("briefing_items").delete().eq("id", id);
  revalidatePath('/admin');
}

export default async function AdminPage(props: { searchParams: Promise<{ key?: string }> }) {
  const searchParams = await props.searchParams;
  
  if (searchParams.key !== "hoxe2026") {
    notFound();
  }

  const { data: days } = await supabase
    .from("daily_briefings")
    .select("*, briefing_items (*)")
    .order("created_at", { ascending: true });

  const safeDays = days || [];
  const totalCards = safeDays.reduce((acc, curr) => acc + (curr.briefing_items?.length || 0), 0);

  return (
    <div className="min-h-screen bg-mist-white text-ink-navy font-sans selection:bg-slate-blue/30 selection:text-ink-navy flex flex-col items-center">
      
      {/* ── Fixed Mobile Header (Light) ── */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-mist-white/80 backdrop-blur-3xl border-b border-ink-navy/10 z-50 flex items-center justify-between px-6 pt-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink-navy/5 border border-ink-navy/10 rounded-full flex items-center justify-center">
            <Fingerprint size={22} className="text-slate-blue" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight leading-none text-ink-navy">Director's Cut</h1>
            <span className="text-[9px] uppercase tracking-widest text-slate-blue/80 font-bold mt-1">Classified Access</span>
          </div>
        </div>
        <div className="bg-ink-navy/5 border border-ink-navy/10 px-5 py-2.5 rounded-full flex items-center gap-2">
          <Database size={14} className="text-ink-navy/40" />
          <span className="text-xs font-bold tracking-widest text-ink-navy/80">{safeDays.length}</span>
        </div>
      </div>

      <div className="pt-36 pb-32 w-full max-w-4xl relative px-4 md:px-12">
        
        {/* Background Ambient (Light) */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-slate-blue/5 rounded-full blur-[100px] pointer-events-none" />

        {/* ── KPI SECTION ── */}
        <section className="mb-12 w-full">
          <div className="bg-white/80 border border-ink-navy/10 rounded-[28px] p-8 flex flex-row items-center justify-between shadow-[0_4px_30px_-10px_rgba(27,46,75,0.08)] relative overflow-hidden w-full box-border">
            {/* Subtle glow inside card */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-blue/10 rounded-full blur-[40px]" />
            
            <div className="flex flex-col relative z-10 w-full ml-2">
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-ink-navy/40 mb-1">System Health</p>
              <h2 className="text-5xl font-serif text-ink-navy tracking-tight leading-none">{totalCards}</h2>
              <p className="text-[9px] uppercase tracking-widest text-ink-navy/30 mt-2">Active Loaded Cards</p>
            </div>
            <div className="w-16 h-16 rounded-full border border-slate-blue/20 bg-slate-blue/10 flex items-center justify-center shrink-0 relative z-10 mr-2">
              <Zap size={24} className="text-slate-blue" />
            </div>
          </div>
        </section>

        {/* ── DAYS STREAM ── */}
        <div className="space-y-16 w-full">
          {safeDays.map((day) => {
            const items = day.briefing_items || [];
            
            return (
              <section key={day.id} className="relative w-full overflow-hidden">
                {/* Date Header */}
                <div className="px-2 md:px-0 flex items-end justify-between mb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-ink-navy/40 font-bold mb-1">{day.day_of_week}</p>
                    <h3 className="font-serif text-4xl text-ink-navy tracking-tighter leading-none">{day.date}</h3>
                  </div>
                  <div className="bg-ink-navy/5 px-3 py-1.5 rounded-full flex gap-2 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-blue rounded-full animate-pulse" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-ink-navy/60">{items.length} ITMS</span>
                  </div>
                </div>

                 {/* Horizontal Scroll Cards array */}
                 <div className="w-[100vw] relative left-1/2 -translate-x-1/2 md:w-full md:left-0 md:translate-x-0 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
                    {/* Add generous padding to the flex container so first card aligns visually or is just scrollable */}
                    <div className="flex gap-4 px-6 md:px-0 inline-flex min-w-max">
                      {items.length === 0 ? (
                         <div className="w-[85vw] md:w-[320px] shrink-0 snap-center bg-white/50 border border-dashed border-ink-navy/10 rounded-3xl h-64 flex flex-col items-center justify-center">
                           <Calendar className="text-ink-navy/20 mb-4" size={32} />
                           <p className="font-serif text-ink-navy/40 italic text-sm">Sin tarjetas cargadas.</p>
                         </div>
                      ) : (
                        items.map((item: any) => (
                          <div key={item.id} className="w-[85vw] md:w-[320px] shrink-0 snap-center bg-white border border-ink-navy/10 rounded-[32px] overflow-hidden flex flex-col shadow-lg relative group pb-16">
                            
                            {/* Card Visual Header */}
                            <div className="h-44 w-full relative bg-ink-navy/5 border-b border-ink-navy/5">
                                {item.image_url ? (
                                  <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover mix-blend-multiply opacity-90" />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-10">
                                    <Database size={40} className="text-ink-navy" />
                                  </div>
                                )}
                                
                                <div className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-md border border-ink-navy/10 px-3 py-1.5 rounded-full shadow-sm">
                                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-ink-navy">{item.year}</span>
                                </div>
                                <div className="absolute top-4 right-4 z-20 bg-slate-blue text-white shadow-md border border-slate-blue/50 px-3 py-1.5 rounded-full">
                                  <span className="text-[8px] uppercase tracking-widest font-bold">{item.category}</span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col relative z-20">
                              <h4 className="font-serif text-lg leading-tight text-ink-navy mb-3">{item.title}</h4>
                              <p className="text-ink-navy/60 text-[11px] leading-relaxed line-clamp-4">{item.short_explanation}</p>
                            </div>

                            {/* Form Delete Action docked bottom */}
                            <form action={deleteItem} className="absolute bottom-0 left-0 right-0 p-3 pt-0">
                               <input type="hidden" name="id" value={item.id} />
                               <button 
                                 type="submit" 
                                 className="w-full bg-red-50 hover:bg-red-100 border border-red-500/10 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                               >
                                 <Trash2 size={12} className="text-red-500/80" />
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-red-500/80">Destruir Target</span>
                               </button>
                            </form>
                          </div>
                        ))
                      )}
                    </div>
                 </div>
              </section>
            );
          })}

          {safeDays.length === 0 && (
             <div className="pt-20 text-center w-full">
                <Database size={40} className="text-ink-navy/10 mx-auto mb-6" />
                <h2 className="font-serif text-2xl text-ink-navy/50 mb-2">Ausencia de Datos</h2>
                <p className="text-ink-navy/40 text-xs">Usa el importador de CSV local.</p>
             </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
