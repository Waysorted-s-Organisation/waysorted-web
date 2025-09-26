"use client";
<<<<<<< HEAD
import Header from "@/components/Header";
=======
>>>>>>> b8f5e461e82c582b415a3e5856f4139a74996934
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
<<<<<<< HEAD
      <main
        className={`min-h-screen bg-gray-50 transition-all duration-300 ${
          showBanner ? "pt-24" : "pt-16"
        }`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />
        <HeroSection />
        <StorySection />
        <VisionSection />
        <ValuesSection />
        <TeamSection />
        <TeamCollage />
        <JoinCommunity />
=======
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
<<<<<<< HEAD
>>>>>>> b8f5e461e82c582b415a3e5856f4139a74996934
=======
      <Footer />
>>>>>>> 06e297960e3c6566d296151cb4b0f23c49fc30c8
      </main>
    </>
  );
}
