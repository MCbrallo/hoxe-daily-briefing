"use client";

interface MediaEmbedProps {
  title: string;
  artist: string;
  youtubeId: string;
}

export function MediaEmbed({ title, artist, youtubeId }: MediaEmbedProps) {
  if (!youtubeId) return null;

  return (
    <div className="w-full relative shadow-2xl rounded-2xl overflow-hidden bg-black/90 border border-white/10 group">
      <div className="flex items-center px-4 py-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500 mr-2 drop-shadow-md pb-0.5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white uppercase tracking-[0.1em] line-clamp-1">{title}</span>
          <span className="text-[8px] text-white/50 font-medium uppercase tracking-widest">{artist}</span>
        </div>
      </div>
      <div className="w-full relative" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          title={title}
        />
      </div>
    </div>
  );
}
