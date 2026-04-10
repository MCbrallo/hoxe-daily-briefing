"use client";

interface MusicPlayerProps {
  title: string;
  artist: string;
  spotifyTrackId: string;
}

export function MusicPlayerCard({ title, artist, spotifyTrackId }: MusicPlayerProps) {
  return (
    <div className="w-full">
      <iframe
        src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block w-full rounded-lg"
        title={`${title} by ${artist}`}
      />
    </div>
  );
}
