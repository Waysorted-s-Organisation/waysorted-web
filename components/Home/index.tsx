"use client"
import { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';
// import FloatingButton from '@/components/FloatingButton'
import Hero from '@/components/Hero/index'
import ImpactTop from '@/components/ImpactTop'
import TopSection from '@/components/TopSection/index'
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Dynamically import heavy animation components
const ToolsGrid = dynamic(() => import('@/components/ToolsGrid/index'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});

const InfoCards = dynamic(() => import('@/components/InfoCards').then(mod => ({ default: mod.InfoCards })), {
  loading: () => <div className="h-screen" />,
  ssr: false
});

const SecureAnimation = dynamic(() => import("@/components/SecureAnimation"), {
  loading: () => <div className="h-[200vh]" />,
  ssr: false
});

const SecureCards = dynamic(() => import("@/components/SecureCards/index"), {
  loading: () => <div className="h-screen" />,
  ssr: false
});

const FloatingStatsSection = dynamic(() => import("../FloatingStats"), {
  loading: () => <div className="h-screen" />,
  ssr: false
});

const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <div className="h-96" />
});

const GetStarted = dynamic(() => import('@/components/GetStarted'), {
  loading: () => <div className="h-96" />
});

export default function Home() {
    const { showBanner, setShowBanner } = useBanner();
    const [showSecureCards, setShowSecureCards] = useState(false);
    const secureCardsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Use Intersection Observer instead of scroll listener for better performance
    if (!secureCardsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setShowSecureCards(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(secureCardsRef.current);

    return () => {
      observer.disconnect();
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
        ref={secureCardsRef}
        className={`transition-opacity duration-700 ${
          showSecureCards ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
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
