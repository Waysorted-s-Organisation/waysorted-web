"use client"
import { type ReactNode, useEffect, useRef, useState } from "react";
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

/**
 * Section wrapper that reserves height to avoid layout shift.
 *
 * `defer` gates the children behind an IntersectionObserver. That is a real
 * performance win, but it also means the children are absent from the server
 * HTML and only appear once the section scrolls into view - so search engines
 * never see them. Googlebot renders with a tall viewport but does not reliably
 * scroll a ~10,000px page, which previously left the homepage at 251 indexable
 * words with no footer links at all.
 *
 * So `defer` is opt-in, and reserved for decorative sections. Anything carrying
 * copy or links renders on the server. The components are still code-split via
 * next/dynamic either way, so the JS is not shipped any earlier.
 */
function LazySection({
  children,
  className = "",
  id,
  minHeight,
  rootMargin = "100px 0px",
  threshold = 0.01,
  defer = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  minHeight: string;
  rootMargin?: string;
  threshold?: number;
  defer?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(!defer);

  useEffect(() => {
    if (!defer) return;
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
  }, [defer, rootMargin, shouldRender, threshold]);

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
      {/* Deferred: purely decorative scroll animation, and hidden below md. */}
      <LazySection id="secure-animation" minHeight="200vh" className="hidden md:block" defer>
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
