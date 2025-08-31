"use client"
import { FloatingButton } from '@/components/FloatingButton'
import Header from '@/components/Header/index'
import Hero from '@/components/Hero/index'
import ImpactTop from '@/components/ImpactTop'
import { InfoCards } from '@/components/InfoCards'
import ToolsGrid from '@/components/ToolsGrid/index'
import TopSection from '@/components/TopSection/index'
import { useBanner } from "@/context/BannerContext";

export default function Home() {
  const { showBanner, setShowBanner } = useBanner();
  return (
    <main className={`min-h-screen bg-gray-50 transition-all duration-300 ${
        showBanner ? "pt-24" : "pt-16"
      }`}
    >
      <Header showBanner={showBanner} setShowBanner={setShowBanner}/>
      <Hero />
      <ToolsGrid />
      <TopSection />
      <FloatingButton />
      <ImpactTop />
      <InfoCards />
    </main>
  )
}