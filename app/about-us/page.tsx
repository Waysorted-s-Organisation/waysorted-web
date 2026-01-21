"use client";
import HeroSection from "./sections/HeroSection";
import VisionSection from "./sections/VisionSection";
import ValuesSection from "./sections/ValueSection";
import StorySection from "./sections/StorySection";
import TeamSection from "./sections/TeamSection";
import TeamCollage from "./sections/TeamCollage";
import JoinCommunity from "@/components/JoinCommunity";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutUs() {
  const { showBanner, setShowBanner } = useBanner();
  return (
    <>
      <main
        className={`min-h-screen bg-white transition-all duration-300 select-none ${showBanner ? "pt-24" : "pt-16"
          }`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />
        <HeroSection />
        <TeamSection />
        <VisionSection />
        <ValuesSection />
        <StorySection />
        <TeamCollage />
        <JoinCommunity />
        <Footer />
      </main>
    </>
  );
}
