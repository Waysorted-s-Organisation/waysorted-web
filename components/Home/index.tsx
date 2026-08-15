"use client"
import { type ReactNode, useEffect, useRef, useState } from "react";
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

function LazySection({
  children,
  className = "",
  id,
  minHeight,
  rootMargin = "100px 0px",
  threshold = 0.01,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  minHeight: string;
  rootMargin?: string;
  threshold?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || shouldRender) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin, threshold },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender, threshold]);

  return (
    <div
      ref={sectionRef}
      id={id}
      className={className}
      style={{ minHeight }}
      aria-busy={!shouldRender}
    >
      {shouldRender ? children : null}
    </div>
  );
}

export default function Home() {
  const { showBanner, setShowBanner } = useBanner();

  return (
    <main
      className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`}
    >
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <Hero />
      <LazySection minHeight="50vh" rootMargin="0px 0px -35% 0px">
        <ToolsGrid />
      </LazySection>
      <LazySection minHeight="clamp(780px, 160vh, 1650px)">
        <TopSection />
      </LazySection>
      {/* <FloatingButton /> */}
      <LazySection minHeight="240px">
        <ImpactTop />
      </LazySection>
      <LazySection minHeight="420px">
        <InfoCards />
      </LazySection>
      <div className="my-60" />
      {/* Section 1: Secure Animation */}
      <LazySection id="secure-animation" minHeight="200vh" className="hidden md:block">
        <section className="h-[200vh]">
          <SecureAnimation />
        </section>
      </LazySection>

      {/* Section 2: Secure Cards */}
      <LazySection
        id="secure-cards"
        minHeight="100vh"
      >
        <SecureCards />
      </LazySection>
      <LazySection minHeight="100vh">
        <FloatingStatsSection />
      </LazySection>
      <LazySection minHeight="720px">
        <Testimonials />
      </LazySection>
      <LazySection minHeight="720px">
        <GetStarted />
      </LazySection>
      <LazySection minHeight="520px">
        <Footer />
      </LazySection>
    </main>
  )
}
