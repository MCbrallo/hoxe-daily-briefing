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
 * Supports Spotify, Deezer, and YouTube dynamically based on the ID format.
 */
export function MusicPlayerCard({ trackTitle, artistName, spotifyId }: MusicPlayerProps) {
  const [failed, setFailed] = useState(false);

  if (!spotifyId) return null;

  const isDeezer = /^\d+$/.test(spotifyId);
  const isYouTube = spotifyId.length === 11 && !spotifyId.includes(' ');
  const isSpotify = !isDeezer && !isYouTube;

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
        <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-slate-100" style={{ position: 'relative', height: isYouTube ? 200 : 80 }}>
          {isYouTube ? (
            <iframe
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${spotifyId}?autoplay=0&showinfo=0&controls=1`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{ border: "0" }}
              onError={() => setFailed(true)}
            />
          ) : isDeezer ? (
            <iframe 
              title="deezer-widget" 
              src={`https://widget.deezer.com/widget/light/track/${spotifyId}`} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              // @ts-ignore - React expects lowercase DOM attribute to avoid hydration warning
              allowtransparency="true" 
              allow="encrypted-media; clipboard-write; autoplay"
              style={{ border: "0", borderRadius: "12px", pointerEvents: "auto", outline: "none" }}
              onError={() => setFailed(true)}
            />
          ) : (
            <iframe 
              src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
              width="100%" 
              height="100%" 
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              style={{ border: "0", borderRadius: "12px", pointerEvents: "auto", outline: "none" }}
              onError={() => setFailed(true)}
            />
          )}
        </div>
      ) : (
        /* Fallback */
        <a 
          href={isYouTube ? `https://youtube.com/watch?v=${spotifyId}` : isDeezer ? `https://deezer.com/track/${spotifyId}` : `https://open.spotify.com/track/${spotifyId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-navy/10 bg-ink-navy/[0.03] hover:bg-ink-navy/[0.06] transition-colors"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-ink-navy/80 line-clamp-1">{trackTitle}</span>
            <span className="text-[9px] text-ink-navy/40 font-medium tracking-wider uppercase">{artistName} · Open link</span>
          </div>
        </a>
      )}
    </div>
  );
}
