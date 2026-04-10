import { april10Briefing } from "@/lib/mockData";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function EmailPreview() {
  const briefing = april10Briefing;
  const leadItem = briefing.items[0];
  const secondaryItem = briefing.items[1];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0EFEB] py-12 px-4 shadow-inner">
      {/* Email Container Simulator */}
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-8 md:p-12 font-sans border border-[#F7F8F9]">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10 pb-10 border-b border-[#263238]/10 text-center">
          <div className="font-serif text-3xl tracking-widest text-[#0E1B2A] font-bold mb-6">
            HOXE
          </div>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#455A64] mb-2">
            {briefing.dayOfWeek}
          </div>
          <div className="font-serif text-4xl text-[#0E1B2A]">
            {briefing.date}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 text-[#263238]">
          <p className="text-sm font-medium leading-relaxed italic text-[#455A64]">
            Good morning.<br/><br/>
            Here is HOXE for {briefing.date}.<br/>
            {briefing.introAtmosphere}
          </p>

          <div className="mt-4">
             <div className="text-[10px] font-bold tracking-widest uppercase text-[#455A64] mb-2">Lead Moment</div>
             <h2 className="font-serif text-2xl font-bold text-[#0E1B2A] mb-3">{leadItem.title}</h2>
             <p className="text-sm leading-relaxed mb-4 text-[#455A64]">{leadItem.shortExplanation}</p>
          </div>

          <div className="pt-6 border-t border-[#263238]/5">
             <div className="text-[10px] font-bold tracking-widest uppercase text-[#455A64] mb-2">Local Lens</div>
             <h3 className="font-serif text-lg font-bold text-[#0E1B2A] mb-2">{secondaryItem.title}</h3>
             <p className="text-sm leading-relaxed text-[#455A64]">{secondaryItem.shortExplanation}</p>
          </div>

          <div className="pt-6 border-t border-[#263238]/5 bg-[#F7F8F9] -mx-8 px-8 py-6 mt-4">
             <p className="text-sm italic text-[#455A64]">
               Also today: the recording sessions of Magellan Mystery Tour began, and the first photograph of a black hole was released.
             </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex justify-center">
           <Link href="/" className="bg-[#0E1B2A] text-white px-8 py-4 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#1D3557] transition-colors flex items-center justify-center gap-2 w-full text-center">
             Open Today <ArrowRight size={14} />
           </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#263238]/10 text-center">
           <p className="text-[10px] text-[#455A64] tracking-wider uppercase mb-2">HOXE • Atlantic Galician Premium</p>
           <p className="text-[10px] text-[#455A64]/60">You are receiving this because of your 09:00 ritual settings.</p>
        </div>

      </div>
    </div>
  );
}
