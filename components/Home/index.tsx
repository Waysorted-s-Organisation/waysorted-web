"use client"
import { useEffect, useState } from "react";
import FloatingButton from '@/components/FloatingButton'
import Hero from '@/components/Hero/index'
import ImpactTop from '@/components/ImpactTop'
import { InfoCards } from '@/components/InfoCards'
import ToolsGrid from '@/components/ToolsGrid/index'
import TopSection from '@/components/TopSection/index'
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import GetStarted from '@/components/GetStarted'
import Testimonials from '@/components/Testimonials'
import Coffee from '@/components/Coffee'
import Comments from '@/components/Comments'
import Footer from "@/components/Footer";
import SecureAnimation from "@/components/SecureAnimation";
import SecureCards from "@/components/SecureCards/index";

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
            className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"
                }`}
        >
            <Header showBanner={showBanner} setShowBanner={setShowBanner} />
            <Hero />
            <ToolsGrid />
            <TopSection />
            <FloatingButton />
            <ImpactTop />
            <InfoCards />
             {/* Section 1: Secure Animation */}
      <section className="h-[200vh]">
        <SecureAnimation />
      </section>

      {/* Section 2: Secure Cards */}
      <section
        className={`transition-opacity duration-700 ${
          showSecureCards ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <SecureCards />
      </section>
            <Coffee />
            <Comments />
            <Testimonials />
            <GetStarted />
            <Footer />
        </main>
    )
}