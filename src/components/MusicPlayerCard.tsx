"use client";

import { useState, useEffect } from "react";

interface MusicPlayerProps {
  trackTitle: string;
  artistName: string;
  albumCover: string;
  spotifyId: string;
}

/**
 * Bulletproof music player for HOXE.
 * 
 * DESKTOP: Uses embedded iframe (YouTube / Deezer / Spotify) — works perfectly.
 * MOBILE: YouTube iframes don't receive touch events inside scroll containers
 *         (known WebKit/Chrome limitation with cross-origin iframes).
 *         Instead, shows a beautiful thumbnail card that opens YouTube directly
 *         when tapped — guaranteed playback on every mobile device.
 */
export function MusicPlayerCard({ trackTitle, artistName, albumCover, spotifyId }: MusicPlayerProps) {
  const [failed, setFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile by screen width (matches Tailwind md: breakpoint)
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!spotifyId) return null;

  const isDeezer = /^\d+$/.test(spotifyId);
  const isYouTube = spotifyId.length === 11 && !spotifyId.includes(' ');
  const isSpotify = !isDeezer && !isYouTube;

  // YouTube thumbnail URL (high quality)
  const ytThumbnail = isYouTube ? `https://img.youtube.com/vi/${spotifyId}/hqdefault.jpg` : null;
  const ytWatchUrl = isYouTube ? `https://www.youtube.com/watch?v=${spotifyId}` : null;

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

      {/* ─── MOBILE YOUTUBE: Thumbnail card that opens YouTube directly ─── */}
      {isYouTube && isMobile ? (
        <a
          href={ytWatchUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] relative group"
          style={{ height: 180 }}
        >
          {/* Thumbnail */}
          <img
            src={ytThumbnail!}
            alt={trackTitle}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-active:from-black/80" />
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          {/* Track info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <p className="text-white text-[13px] font-bold line-clamp-1 drop-shadow-sm">{trackTitle}</p>
            <p className="text-white/60 text-[10px] font-medium tracking-wider uppercase mt-0.5">{artistName} · YouTube</p>
          </div>
        </a>
      ) : !failed ? (
        /* ─── DESKTOP: Standard iframe embed ─── */
        <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-slate-100" style={{ position: 'relative', height: isYouTube ? 200 : 80 }}>
          {isYouTube ? (
            <iframe
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${spotifyId}?autoplay=0&showinfo=0&controls=1&playsinline=1`} 
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
              // @ts-ignore
              allowtransparency="true" 
              allow="encrypted-media; clipboard-write; autoplay"
              style={{ border: "0" }}
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
              style={{ border: "0" }}
              onError={() => setFailed(true)}
            />
          )}
        </div>
      ) : (
        /* ─── FALLBACK: Open link directly ─── */
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
