"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Flame, Archive, Bookmark, User } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

// Each tab has its own accent color
const TAB_COLORS: Record<string, { active: string; icon: string; dotColor: string }> = {
  "/":          { active: "text-ink-navy",     icon: "text-ink-navy",     dotColor: "bg-ink-navy" },
  "/viral":     { active: "text-red-500",      icon: "text-red-500",      dotColor: "bg-red-500" },
  "/archive":   { active: "text-amber-600",    icon: "text-amber-600",    dotColor: "bg-amber-600" },
  "/saved":     { active: "text-emerald-600",  icon: "text-emerald-600",  dotColor: "bg-emerald-600" },
  "/settings":  { active: "text-slate-500",    icon: "text-slate-500",    dotColor: "bg-slate-500" },
  "/profile":   { active: "text-purple-600",   icon: "text-purple-600",   dotColor: "bg-purple-600" },
};

export function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const primaryNav = [
    { label: t("Today"), href: "/", icon: Compass },
    { label: "Viral", href: "/viral", icon: Flame },
  ];

  const secondaryNav = [
    { label: t("Archive"), href: "/archive", icon: Archive },
    { label: t("Saved"), href: "/saved", icon: Bookmark },
  ];

  const utilityNav = [
    { label: t("Profile"), href: "/profile", icon: User },
  ];

  const allNavItems = [...primaryNav, ...secondaryNav, ...utilityNav];

  return (
    <>
      {/* Desktop Top Navigation */}
      <header className="hidden md:flex fixed top-0 w-full z-50 bg-mist-white/80 backdrop-blur-xl h-16 items-center px-12 justify-between">
        <div className="flex items-center justify-between w-full mx-auto">
          <Link href="/" className="flex items-center gap-3 text-ink-navy hover:opacity-80 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 40 10 L 20 10 C 14 10 10 14 10 20 L 10 80 C 10 86 14 90 20 90 L 80 90 C 86 90 90 86 90 80 L 90 20 C 90 14 86 10 80 10 L 60 10" />
              <path d="M 30 30 L 70 70 M 70 30 L 30 70" />
            </svg>
            <span className="font-serif font-bold text-xl tracking-[0.08em] mt-0.5">HOXE</span>
          </Link>

          <nav className="flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {primaryNav.map((item) => {
              const isActive = pathname === item.href;
              const colors = TAB_COLORS[item.href];
              return (
                <Link key={item.href} href={item.href}
                  className={cn("text-[13px] font-bold tracking-[0.15em] uppercase transition-colors pb-1",
                    isActive ? cn(colors.active, "border-b-[3px]", `border-current`) : "text-ink-navy/70 hover:text-ink-navy")}>
                  {item.label}
                </Link>
              );
            })}
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href;
              const colors = TAB_COLORS[item.href];
              return (
                <Link key={item.href} href={item.href}
                  className={cn("text-[12px] font-medium tracking-[0.15em] uppercase transition-colors pb-1",
                    isActive ? cn(colors.active, "border-b-[3px]", `border-current`) : "text-ink-navy/40 hover:text-ink-navy/70")}>
                  {item.label}
                </Link>
              );
            })}
            <div className="w-[1px] h-4 bg-ink-navy/15 mx-1"></div>
            {utilityNav.map((item) => {
              const isActive = pathname === item.href;
              const colors = TAB_COLORS[item.href];
              return (
                <Link key={item.href} href={item.href}
                  className={cn("text-[11px] font-medium tracking-[0.15em] uppercase transition-colors pb-1",
                    isActive ? cn(colors.active, "border-b-[2px]", `border-current`) : "text-ink-navy/30 hover:text-ink-navy/50")}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest text-ink-navy/30">
             <button onClick={() => setLanguage('en')} className={cn("transition-colors", language === 'en' ? "text-ink-navy underline underline-offset-4 decoration-[1.5px]" : "hover:text-ink-navy")}>EN</button>
             <button onClick={() => setLanguage('es')} className={cn("transition-colors", language === 'es' ? "text-ink-navy underline underline-offset-4 decoration-[1.5px]" : "hover:text-ink-navy")}>ES</button>
             <button onClick={() => setLanguage('gl')} className={cn("transition-colors", language === 'gl' ? "text-ink-navy underline underline-offset-4 decoration-[1.5px]" : "hover:text-ink-navy")}>GL</button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation — Modern Floating Pill */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="backdrop-blur-2xl bg-white/70 px-8 py-3.5 rounded-full shadow-[0_8px_30px_rgba(27,46,75,0.08)] border border-ink-navy/5 flex gap-8 items-center justify-center">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const colors = TAB_COLORS[item.href] || TAB_COLORS["/"];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-300 active:scale-90",
                  isActive ? colors.active : "text-ink-navy/25 hover:text-ink-navy/40"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} className={cn("transition-all duration-300", isActive ? "-translate-y-1" : "")} />
                {isActive && (
                  <span className={cn("absolute -bottom-2 w-1 h-1 rounded-full animate-fade-rise", colors.dotColor)}></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
