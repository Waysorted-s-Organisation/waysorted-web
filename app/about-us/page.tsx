"use client";
import HeroSection from "./components/HeroSection";
import VisionSection from "./components/VisionSection";
import ValuesSection from "./components/ValueSection";
import StorySection from "./components/StorySection";
import TeamSection from "./components/TeamSection";
import TeamCollage from "./components/TeamCollage";
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
