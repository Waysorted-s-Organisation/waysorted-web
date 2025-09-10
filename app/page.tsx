"use client"
import { FloatingButton } from '@/components/FloatingButton'
import Hero from '@/components/Hero/index'
import ImpactTop from '@/components/ImpactTop'
import { InfoCards } from '@/components/InfoCards'
import ToolsGrid from '@/components/ToolsGrid/index'
import TopSection from '@/components/TopSection/index'
import {useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import GetStarted from '@/components/GetStarted'
import Testimonials from '@/components/Testimonials'
import WithTop from '@/components/WithTop'
import Coffee from '@/components/Coffee'
import Comments from '@/components/Comments'

export default function Home() {
  const { showBanner, setShowBanner } = useBanner();
  return (
    <>
    <main
        className={`min-h-screen bg-white transition-all duration-300 ${
          showBanner ? "pt-24" : "pt-16"
        }`}
        >
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <Hero />
      <ToolsGrid />
      <TopSection />
      <FloatingButton />
      <ImpactTop />
      <InfoCards />
      <Coffee />
      <Comments />
      <WithTop />
      <Testimonials />
      <GetStarted />
      </main>
    </>
  )
}