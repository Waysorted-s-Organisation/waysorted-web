"use client"
import { useEffect, useState } from "react";
// import FloatingButton from '@/components/FloatingButton'
import dynamic from 'next/dynamic';
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
// Statically import Hero as it's the LCP section
import Hero from '@/components/Hero/index'

// Dynamic Imports for Below-the-Fold components
const ToolsGrid = dynamic(() => import('@/components/ToolsGrid/index'), { ssr: false });
const TopSection = dynamic(() => import('@/components/TopSection/index'), { ssr: false });
const ImpactTop = dynamic(() => import('@/components/ImpactTop'), { ssr: false });
const InfoCards = dynamic(() => import('@/components/InfoCards').then(mod => mod.InfoCards), { ssr: false });
const GetStarted = dynamic(() => import('@/components/GetStarted'), { ssr: false });
const Testimonials = dynamic(() => import('@/components/Testimonials'), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const SecureAnimation = dynamic(() => import("@/components/SecureAnimation"), { ssr: false });
const SecureCards = dynamic(() => import("@/components/SecureCards/index"));
const FloatingStatsSection = dynamic(() => import("../FloatingStats"), { ssr: false });

export default function Home() {
  const { showBanner, setShowBanner } = useBanner();
  const [showSecureCards, setShowSecureCards] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // When the user scrolls past 1 full viewport height
      if (scrollY >= vh) {
        setShowSecureCards(true);
      } else {
        setShowSecureCards(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main
      className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`}
    >
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <Hero />
      <ToolsGrid />
      <TopSection />
      {/* <FloatingButton /> */}
      <ImpactTop />

      <InfoCards />
      <div className="my-60" />
      {/* Section 1: Secure Animation */}
      <section id="secure-animation" className="h-[200vh] hidden md:block">
        <SecureAnimation />
      </section>

      {/* Section 2: Secure Cards */}
      <section
        id="secure-cards"
        className={`transition-opacity duration-700 ${showSecureCards ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <SecureCards />
      </section>
      <FloatingStatsSection />
      <Testimonials />
      <GetStarted />

      <Footer />
    </main>
  )
}
