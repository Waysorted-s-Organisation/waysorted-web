"use client";
import HeroSection from "./comonents/HeroSection";
import VisionSection from "./comonents/VisionSection";
import ValuesSection from "./comonents/ValueSection";
import StorySection from "./comonents/StorySection";
import TeamSection from "./comonents/TeamSection";
import TeamCollage from "./comonents/TeamCollage";
import JoinCommunity from "@/components/JoinCommunity";
import {useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutUs() {
  const { showBanner, setShowBanner } = useBanner();
  return (
    <>
    <main
        className={`min-h-screen bg-white transition-all duration-300 ${
          showBanner ? "pt-24" : "pt-16"
        }`}
        >
    <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <HeroSection />
      <StorySection />
      <ValuesSection />
      <TeamSection />
      <VisionSection />
      <TeamCollage />
      <JoinCommunity />
      <Footer />
      </main>
    </>
  );
}
