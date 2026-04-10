"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Archive, Bookmark, Settings, User } from "lucide-react";
import { cn } from "@/utils/cn";

export function Navbar() {
  const pathname = usePathname();

  const primaryNav = [
    { label: "Today", href: "/", icon: Compass },
  ];

  const secondaryNav = [
    { label: "Archive", href: "/archive", icon: Archive },
    { label: "Saved", href: "/saved", icon: Bookmark },
  ];

  const utilityNav = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const allNavItems = [...primaryNav, ...secondaryNav, ...utilityNav];

  return (
    <>
      {/* Desktop Top Navigation */}
      <header className="hidden md:flex fixed top-0 w-full z-50 bg-mist-white/90 backdrop-blur-md border-b border-ink-navy/8 h-16 items-center px-12 justify-between">
        <div className="flex items-center justify-between w-full mx-auto">
          {/* Logo — Refined stroke weight */}
          <a href="/" className="flex items-center gap-3 text-ink-navy hover:opacity-80 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 40 10 L 20 10 C 14 10 10 14 10 20 L 10 80 C 10 86 14 90 20 90 L 80 90 C 86 90 90 86 90 80 L 90 20 C 90 14 86 10 80 10 L 60 10" />
              <path d="M 30 30 L 70 70 M 70 30 L 30 70" />
            </svg>
            <span className="font-serif font-bold text-xl tracking-[0.08em] mt-0.5">HOXE</span>
          </a>

          {/* Navigation — Priority Tiers */}
          <nav className="flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {/* Primary: Today */}
            {primaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-[13px] font-bold tracking-[0.15em] uppercase transition-colors pb-1",
                    isActive
                      ? "text-ink-navy border-b-[3px] border-ink-navy"
                      : "text-ink-navy/70 hover:text-ink-navy"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Secondary: Archive, Saved */}
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-[12px] font-medium tracking-[0.15em] uppercase transition-colors pb-1",
                    isActive
                      ? "text-ink-navy border-b-[3px] border-ink-navy"
                      : "text-ink-navy/40 hover:text-ink-navy/70"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="w-[1px] h-4 bg-ink-navy/15 mx-1"></div>

            {/* Utility: Settings, Profile */}
            {utilityNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-[11px] font-medium tracking-[0.15em] uppercase transition-colors pb-1",
                    isActive
                      ? "text-ink-navy border-b-[2px] border-ink-navy/60"
                      : "text-ink-navy/30 hover:text-ink-navy/50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          {/* Languages */}
          <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest text-ink-navy/30">
             <button className="text-ink-navy underline underline-offset-4 decoration-[1.5px]">EN</button>
             <button className="hover:text-ink-navy transition-colors">ES</button>
             <button className="hover:text-ink-navy transition-colors">GL</button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 glass-panel border-t border-mist-white/20 px-6 py-3 pb-safe flex justify-between items-center">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-colors",
                isActive ? "text-ink-navy" : "text-ink-navy/30 hover:text-ink-navy/60"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] uppercase tracking-widest font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
