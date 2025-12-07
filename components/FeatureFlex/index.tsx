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
      <div className="flex flex-col gap-5">
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row gap-5">
          {/* Row 1, Col 1: Way AI 249x163 */}
          <WayAICard className="md:w-[249px] h-[163px]" />

          {/* Row 1, Col 2: Glass Mode 449x163 */}
          <GlassModeCard className="md:w-[449px] h-[163px]" />

          {/* Row 1, Col 3: Secure Data 275x163 */}
          <div
            className="md:w-[275px] h-[163px] p-2 rounded-2xl shadow border border-gray-100
                       flex flex-col overflow-hidden"
            aria-label="Security and encryption information"
          >
            <h3 className="text-base font-medium text-secondary-db-80">
              Protected with top-tier encryption
            </h3>

            {/* Push the icon to the bottom and center it horizontally */}
            <div className="mt-auto self-center">
              {/* If SecureDataGlow supports className, you can size it like: className="w-[84px] h-[84px]" */}
              <SecureDataGlow />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col md:flex-row gap-5">
          {/* Row 2, Col 1: Focus 278x420 */}
          <Focus className="md:w-[278px] h-[420px]" />

          {/* Row 2, Col 2: Wayspace 345x420 */}
          <WayspaceCard className="md:w-[345px] h-[420px]" />

          {/* Row 2, Col 3: Lighter 349x175 + Play Challenge 349x229 (stacked, gap=16) */}
          <div className="flex flex-col gap-4 md:w-[349px]">
            <LighterCard className="md:w-[349px] h-[175px]" />
            <PlaySecureCard className="md:w-[349px] h-[229px]" />
          </div>
        </div>
      </div>
    </section>
  );
}