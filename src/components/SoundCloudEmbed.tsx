"use client";

import { cn } from "@/utils/cn";

interface SoundCloudEmbedProps {
  trackQuery: string; // e.g. "Aretha Franklin Respect"
  title: string;
  year?: string;
}

/**
 * A premium SoundCloud embed card. 
 * Uses the SoundCloud Widget Player iframe with a resolved track URL.
 * Falls back to a stylish search-link card if the track can't be embedded.
 */
export function SoundCloudEmbed({ trackQuery, title, year }: SoundCloudEmbedProps) {
  if (!trackQuery) return null;

  // Build a clean SoundCloud search URL for the user to click
  const searchUrl = `https://soundcloud.com/search/sounds?q=${encodeURIComponent(trackQuery)}`;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-white/[0.06] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] group transition-all duration-500 hover:shadow-[0_12px_50px_-8px_rgba(255,85,0,0.15)]">
      
      {/* SoundCloud Waveform Header Bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
        {/* SoundCloud Logo */}
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#ff5500] shrink-0 drop-shadow-[0_0_8px_rgba(255,85,0,0.4)]">
          <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.058 0 .09-.038.104-.094l.206-1.282L.38 13.147c-.014-.057-.046-.094-.104-.094m1.848-1.01c-.065 0-.105.05-.112.112L1.786 14.5l.226 2.148c.007.064.047.112.112.112.064 0 .104-.048.112-.112L2.48 14.5l-.244-2.345c-.008-.063-.048-.112-.112-.112m.929-.26c-.073 0-.114.06-.121.126L2.7 14.5l.232 2.348c.007.07.048.126.121.126.072 0 .114-.056.121-.126l.265-2.348-.265-2.591c-.007-.066-.049-.126-.121-.126m.938-.254c-.081 0-.123.066-.13.14L4.6 14.5l.261 2.41c.007.074.049.14.13.14.08 0 .122-.066.129-.14l.298-2.41-.298-2.911c-.007-.074-.049-.14-.13-.14m.941-.154c-.089 0-.133.077-.14.154L5.55 14.5l.242 2.434c.007.08.051.154.14.154.087 0 .132-.074.139-.154l.272-2.434-.272-3.121c-.007-.077-.052-.154-.14-.154m.943-.046c-.097 0-.141.084-.148.168L6.49 14.5l.237 2.452c.007.084.051.168.148.168.096 0 .14-.084.147-.168l.267-2.452-.267-3.375c-.007-.084-.051-.168-.148-.168m1.122-.174c-.104 0-.15.091-.156.182l-.258 3.389.258 2.456c.007.091.052.182.156.182.103 0 .148-.091.155-.182l.29-2.456-.29-3.389c-.007-.091-.052-.182-.156-.182m.94.028c-.112 0-.158.098-.163.196l-.249 3.165.249 2.46c.005.098.051.196.163.196.111 0 .157-.098.163-.196l.28-2.46-.28-3.165c-.006-.098-.052-.196-.163-.196m1.127-.437c-.12 0-.166.105-.17.21l-.236 3.374.236 2.46c.004.105.05.21.17.21.119 0 .165-.105.17-.21l.265-2.46-.265-3.374c-.005-.105-.051-.21-.17-.21m.934.189c-.128 0-.174.112-.177.224l-.226 2.961.226 2.455c.003.112.049.224.177.224.127 0 .173-.112.177-.224l.253-2.455-.253-2.961c-.004-.112-.05-.224-.177-.224m1.106-.74c-.135 0-.181.119-.184.238l-.214 3.463.214 2.443c.003.119.049.238.184.238.134 0 .18-.119.184-.238l.24-2.443-.24-3.463c-.004-.119-.05-.238-.184-.238m.932.228c-.143 0-.188.126-.191.252l-.203 2.983.203 2.437c.003.126.048.252.191.252.142 0 .188-.126.191-.252l.226-2.437-.226-2.983c-.003-.126-.049-.252-.191-.252m1.12-.781c-.15 0-.196.133-.198.266l-.192 3.496.192 2.428c.002.133.048.266.198.266.149 0 .195-.133.197-.266l.215-2.428-.215-3.496c-.002-.133-.048-.266-.197-.266m.939.302c-.157 0-.203.14-.205.28l-.182 2.914.182 2.416c.002.14.048.28.205.28.156 0 .202-.14.204-.28l.204-2.416-.204-2.914c-.002-.14-.048-.28-.204-.28m1.134-.86c-.163 0-.21.147-.212.294l-.17 3.48.17 2.401c.002.147.049.294.212.294.162 0 .209-.147.211-.294l.19-2.401-.19-3.48c-.002-.147-.049-.294-.211-.294m.927.382c-.17 0-.217.154-.218.308l-.16 2.79.16 2.386c.001.154.048.308.218.308.169 0 .216-.154.218-.308l.178-2.386-.178-2.79c-.002-.154-.049-.308-.218-.308m1.136-.954c-.177 0-.224.161-.225.322l-.148 3.422.148 2.37c.001.161.048.322.225.322.176 0 .223-.161.224-.322l.165-2.37-.165-3.422c-.001-.161-.048-.322-.224-.322m.934.461c-.184 0-.23.168-.231.336l-.137 2.625.137 2.351c.001.168.047.336.231.336.183 0 .23-.168.231-.336l.153-2.351-.153-2.625c-.001-.168-.048-.336-.231-.336m1.133-1.089c-.191 0-.237.175-.238.35l-.126 3.364.126 2.332c.001.175.047.35.238.35.19 0 .236-.175.237-.35l.141-2.332-.141-3.364c-.001-.175-.047-.35-.237-.35m.932.546c-.198 0-.243.182-.244.364l-.116 2.454.116 2.312c.001.182.046.364.244.364.197 0 .243-.182.244-.364l.128-2.312-.128-2.454c-.001-.182-.047-.364-.244-.364m.506-.103c-.06 0-.119.01-.175.031-.167-1.86-1.728-3.31-3.624-3.31-.482 0-.943.101-1.363.28-.176.075-.224.15-.225.298v6.608c.002.155.13.283.285.295h5.102c.988 0 1.789-.8 1.789-1.789 0-.989-.801-1.789-1.789-1.789"/>
        </svg>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-[0.1em] line-clamp-1 leading-tight">{title}</span>
          {year && <span className="text-[8px] text-white/30 font-medium tracking-widest uppercase">{year}</span>}
        </div>
      </div>

      {/* Animated Waveform Decoration */}
      <div className="px-5 py-4 flex items-end gap-[2px] h-16 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => {
          const height = 15 + Math.random() * 85;
          return (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-[#ff5500]/60 to-[#ff5500]/20 rounded-full transition-all duration-[2000ms] group-hover:from-[#ff5500] group-hover:to-[#ff8800]/50"
              style={{ height: `${height}%`, animationDelay: `${i * 30}ms` }}
            />
          );
        })}
      </div>

      {/* Play / Listen Button */}
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 mx-5 mb-5 bg-[#ff5500] hover:bg-[#ff6a1a] text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Listen on SoundCloud
      </a>
    </div>
  );
}
