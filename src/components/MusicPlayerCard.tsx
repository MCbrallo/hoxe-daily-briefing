"use client";

import { useState, useRef, useCallback } from "react";

interface MusicPlayerProps {
  trackTitle: string;
  artistName: string;
  albumCover: string;
  spotifyId: string;
}

/**
 * Bulletproof inline music player for HOXE.
 * 
 * YouTube: Two-phase inline player.
 *   Phase 1: Thumbnail + play button (regular DOM, works on mobile).
 *   Phase 2: Replaces thumbnail with iframe (autoplay=1).
 *   Custom play/pause button overlaid using YouTube postMessage API.
 *   
 * IMPORTANT: This component must be rendered OUTSIDE any overflow-y-auto
 * container for mobile touch events to reach the iframe.
 */
export function MusicPlayerCard({ trackTitle, artistName, albumCover, spotifyId }: MusicPlayerProps) {
  const [failed, setFailed] = useState(false);
  const [ytActivated, setYtActivated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!spotifyId) return null;

  const isDeezer = /^\d+$/.test(spotifyId);
  const isYouTube = spotifyId.length === 11 && !spotifyId.includes(' ');

  const ytThumbnail = isYouTube ? `https://img.youtube.com/vi/${spotifyId}/hqdefault.jpg` : null;

  const ytCommand = useCallback((func: string) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args: "" }), "*"
    );
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      ytCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      ytCommand("playVideo");
      setIsPlaying(true);
    }
  }, [isPlaying, ytCommand]);

  return (
    <div className="w-full mt-3 mb-1">
      {/* Subtle label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-[1px] bg-ink-navy/20" />
        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-ink-navy/30">Listen</span>
        <div className="flex-1 h-[1px] bg-ink-navy/10" />
      </div>

      {isYouTube ? (
        <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-black relative" style={{ height: 200 }}>
          {!ytActivated ? (
            /* Phase 1: Thumbnail */
            <button
              onClick={() => { setYtActivated(true); setIsPlaying(true); }}
              className="w-full h-full relative block group cursor-pointer bg-black"
              aria-label="Play video"
            >
              <img src={ytThumbnail!} alt={trackTitle} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-11 bg-red-600 rounded-xl flex items-center justify-center shadow-lg group-active:scale-90 transition-all">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                <p className="text-white text-[12px] font-bold line-clamp-1 drop-shadow-sm">{trackTitle}</p>
                <p className="text-white/50 text-[9px] font-medium tracking-wider uppercase mt-0.5">{artistName}</p>
              </div>
            </button>
          ) : (
            /* Phase 2: Inline iframe + custom controls */
            <>
              <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${spotifyId}?autoplay=1&playsinline=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: "0", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
              {/* Custom play/pause button — always accessible on mobile */}
              <button
                onClick={togglePlay}
                className="absolute bottom-2 right-2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform border border-white/20"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              {/* Stop button — kills the video and goes back to thumbnail */}
              <button
                onClick={() => { setYtActivated(false); setIsPlaying(false); }}
                className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform border border-white/20"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </>
          )}
        </div>
      ) : !failed ? (
        <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-slate-100" style={{ position: 'relative', height: 80 }}>
          {isDeezer ? (
            <iframe title="deezer-widget" src={`https://widget.deezer.com/widget/light/track/${spotifyId}`}
              width="100%" height="100%" frameBorder="0"
              // @ts-ignore
              allowtransparency="true" allow="encrypted-media; clipboard-write; autoplay"
              style={{ border: "0" }} onError={() => setFailed(true)} />
          ) : (
            <iframe src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
              width="100%" height="100%" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" style={{ border: "0" }} onError={() => setFailed(true)} />
          )}
        </div>
      ) : (
        <a href={isDeezer ? `https://deezer.com/track/${spotifyId}` : `https://open.spotify.com/track/${spotifyId}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-navy/10 bg-ink-navy/[0.03]">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-ink-navy/80 line-clamp-1">{trackTitle}</span>
            <span className="text-[9px] text-ink-navy/40 font-medium tracking-wider uppercase">{artistName} · Open link</span>
          </div>
        </a>
      )}
    </div>
  );
}
