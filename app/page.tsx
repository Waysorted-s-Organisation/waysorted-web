"use client"
import { FloatingButton } from '@/components/FloatingButton'
import Hero from '@/components/Hero/index'
import ImpactTop from '@/components/ImpactTop'
import { InfoCards } from '@/components/InfoCards'
import ToolsGrid from '@/components/ToolsGrid/index'
import TopSection from '@/components/TopSection/index'

export default function Home() {

  return (
    <>
      <Hero />
      <ToolsGrid />
      <TopSection />
      <FloatingButton />
      <ImpactTop />
      <InfoCards />
    </>
  )
}