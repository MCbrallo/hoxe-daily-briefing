"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface MusicPlayerProps {
  trackTitle: string;
  artistName: string;
  albumCover: string;
  spotifyId: string;
}

/**
 * Bulletproof music player for HOXE.
 * 
 * YouTube: Uses a two-phase approach with custom DOM controls:
 *   1. Thumbnail card with play button (works on all devices)
 *   2. On tap: opens overlay with iframe + OUR OWN play/pause button
 *      overlaid on top. The button uses YouTube's postMessage API
 *      to control playback — no need to touch the cross-origin iframe.
 */
export function MusicPlayerCard({ trackTitle, artistName, albumCover, spotifyId }: MusicPlayerProps) {
  const [failed, setFailed] = useState(false);
  const [ytActivated, setYtActivated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  if (!spotifyId) return null;

  const isDeezer = /^\d+$/.test(spotifyId);
  const isYouTube = spotifyId.length === 11 && !spotifyId.includes(' ');

  const ytThumbnail = isYouTube ? `https://img.youtube.com/vi/${spotifyId}/hqdefault.jpg` : null;

  // Send commands to YouTube player via postMessage
  const ytCommand = useCallback((func: string) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args: "" }),
      "*"
    );
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      ytCommand("pauseVideo");
      setIsPlaying(false);
      setShowControls(true); // Keep controls visible when paused
    } else {
      ytCommand("playVideo");
      setIsPlaying(true);
      // Auto-hide controls after 2s
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => setShowControls(false), 2000);
    }
  }, [isPlaying, ytCommand]);

  const handleTapOverlay = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  // Auto-hide controls after initial play
  useEffect(() => {
    if (ytActivated) {
      const t = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(t);
    }
  }, [ytActivated]);

  // Listen for YouTube player state changes
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "onStateChange") {
          // 1 = playing, 2 = paused
          if (data.info === 1) setIsPlaying(true);
          if (data.info === 2) setIsPlaying(false);
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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

      {isYouTube ? (
        <>
          {/* Thumbnail card — always visible inline */}
          <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-black" style={{ position: 'relative', height: 200 }}>
            <button
              onClick={() => { setYtActivated(true); setIsPlaying(true); setShowControls(true); }}
              className="w-full h-full relative block group cursor-pointer bg-black"
              aria-label="Play video"
            >
              <img src={ytThumbnail!} alt={trackTitle} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 group-hover:from-black/70 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-11 bg-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-red-700 group-active:scale-90 transition-all">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                <p className="text-white text-[12px] font-bold line-clamp-1 drop-shadow-sm">{trackTitle}</p>
                <p className="text-white/50 text-[9px] font-medium tracking-wider uppercase mt-0.5">{artistName}</p>
              </div>
            </button>
          </div>

          {/* Overlay player with custom controls */}
          {ytActivated && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
              {/* Close button */}
              <button
                onClick={() => { setYtActivated(false); setIsPlaying(false); }}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors z-20"
                aria-label="Close player"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* Track info */}
              <div className="absolute top-5 left-5 md:top-7 md:left-8 z-20 max-w-[70%]">
                <p className="text-white/90 text-sm font-bold line-clamp-1">{trackTitle}</p>
                <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mt-0.5">{artistName}</p>
              </div>

              {/* Video container */}
              <div className="w-[92%] md:w-[70%] lg:w-[55%] max-w-3xl aspect-video relative rounded-xl overflow-hidden shadow-2xl">
                {/* YouTube iframe — enablejsapi=1 allows postMessage control */}
                <iframe
                  ref={iframeRef}
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${spotifyId}?autoplay=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: "0" }}
                />

                {/* OUR custom controls overlay — regular DOM, works on every mobile device */}
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleTapOverlay(); }}
                  onDoubleClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                >
                  {/* Tap to show controls, tap play/pause to toggle */}
                  <div className={`transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                      className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                    >
                      {isPlaying ? (
                        /* Pause icon */
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                          <rect x="6" y="4" width="4" height="16" rx="1"/>
                          <rect x="14" y="4" width="4" height="16" rx="1"/>
                        </svg>
                      ) : (
                        /* Play icon */
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : !failed ? (
        <div className="w-full rounded-xl overflow-hidden border border-ink-navy/[0.06] bg-slate-100" style={{ position: 'relative', height: 80 }}>
          {isDeezer ? (
            <iframe
              title="deezer-widget"
              src={`https://widget.deezer.com/widget/light/track/${spotifyId}`}
              width="100%" height="100%" frameBorder="0"
              // @ts-ignore
              allowtransparency="true"
              allow="encrypted-media; clipboard-write; autoplay"
              style={{ border: "0" }}
              onError={() => setFailed(true)}
            />
          ) : (
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
              width="100%" height="100%" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ border: "0" }}
              onError={() => setFailed(true)}
            />
          )}
        </div>
      ) : (
        <a
          href={isDeezer ? `https://deezer.com/track/${spotifyId}` : `https://open.spotify.com/track/${spotifyId}`}
          target="_blank" rel="noopener noreferrer"
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
