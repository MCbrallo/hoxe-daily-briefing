"use client";

import { useState } from "react";

interface MusicPlayerProps {
  trackTitle: string;
  artistName: string;
  albumCover: string;
  spotifyId: string;
}

/**
 * Minimal, editorial music player for HOXE.
 * Uses Spotify's compact embed (height 80) for a clean inline experience.
 * No registration needed — Spotify embeds are free and public.
 * If the embed fails to load, shows a clean fallback link.
 */
export function MusicPlayerCard({ trackTitle, artistName, spotifyId }: MusicPlayerProps) {
  const [failed, setFailed] = useState(false);

  if (!spotifyId) return null;

  return (
    <div className="w-full mt-3 mb-1">
      {/* Subtle label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-[1px] bg-ink-navy/20" />
        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-ink-navy/30">
          Listen
        </span>
        <div className="flex-1 h-[1px] bg-ink-navy/10" />
      </div>

      {!failed ? (
        /* Spotify compact embed — 80px height, dark theme */
        <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-slate-100" style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', height: 80, transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}>
          <iframe 
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
            width="100%" 
            height="80" 
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
            style={{ border: "0", borderRadius: "12px", pointerEvents: "auto", position: "absolute", top: 0, left: 0 }}
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        /* Fallback: clean link to Spotify */
        <a 
          href={`https://open.spotify.com/track/${spotifyId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-navy/10 bg-ink-navy/[0.03] hover:bg-ink-navy/[0.06] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1DB954] shrink-0">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-ink-navy/80 line-clamp-1">{trackTitle}</span>
            <span className="text-[9px] text-ink-navy/40 font-medium tracking-wider uppercase">{artistName} · Open in Spotify</span>
          </div>
        </a>
      )}
    </div>
  );
}
