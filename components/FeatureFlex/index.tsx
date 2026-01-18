"use client";
import WayAICard from "./WayAICard";
import GlassModeCard from "./GlassModeCard";
import Focus from "./Focus";
import WayspaceCard from "./WayspaceCard";
import LighterCard from "./LighterCard";
import PlaySecureCard from "./PlaySecureCard";
import SecureDataGlow from "./SecureDataGlow";

export default function FeatureFlex() {
  return (
    <section className="w-full flex justify-center py-10">
      <div className="flex flex-col gap-5 w-full max-w-7xl px-4 items-center md:px-0">
        
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row gap-5 w-full md:w-auto">
          <WayAICard className="w-full md:w-[249px] h-[163px]" />
          <GlassModeCard className="w-full md:w-[449px] h-[163px]" />
          <div
            className="w-full md:w-[275px] h-[163px] p-2 rounded-2xl border border-gray-100 flex flex-col overflow-hidden"
            aria-label="Security and encryption information"
          >
            <h3 className="text-base font-medium text-secondary-db-80">
              Protected with top-tier encryption
            </h3>
            <div className="mt-auto self-center">
              <SecureDataGlow />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col md:flex-row gap-5 w-full md:w-auto">

          <Focus className="w-full md:w-[278px] h-[420px]" />

          <WayspaceCard className="w-full md:w-[345px] h-[420px]" />

          <div className="flex flex-col gap-4 w-full md:w-[349px]">
            <LighterCard className="w-full md:w-[349px] h-[175px]" />
            <PlaySecureCard className="w-full md:w-[349px] h-[229px]" />
          </div>
        </div>
      </div>
    </section>
  );
}