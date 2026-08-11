"use client"
import { useEffect, useState } from "react";
// import FloatingButton from '@/components/FloatingButton'
import dynamic from 'next/dynamic';
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
// Statically import Hero as it's the LCP section
import Hero from '@/components/Hero/index'

// Below-the-fold components. These are still code-split and lazily loaded, but
// they are NO LONGER `ssr: false`.
//
// Why: with `ssr: false` the server HTML contained only the Hero, so Google
// indexed ~310 words of a page that actually renders ~922, and the footer's
// nav links did not exist for crawlers at all. All DOM access in these
// components is inside useEffect/useLayoutEffect/useGSAP, none of which run
// during SSR, so server rendering them is safe.
const ToolsGrid = dynamic(() => import('@/components/ToolsGrid/index'));
const TopSection = dynamic(() => import('@/components/TopSection/index'));
const ImpactTop = dynamic(() => import('@/components/ImpactTop'));
const InfoCards = dynamic(() => import('@/components/InfoCards').then(mod => mod.InfoCards));
const GetStarted = dynamic(() => import('@/components/GetStarted'));
const Testimonials = dynamic(() => import('@/components/Testimonials'));
const Footer = dynamic(() => import("@/components/Footer"));
const SecureAnimation = dynamic(() => import("@/components/SecureAnimation"));
const SecureCards = dynamic(() => import("@/components/SecureCards/index"));
const FloatingStatsSection = dynamic(() => import("../FloatingStats"));

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
