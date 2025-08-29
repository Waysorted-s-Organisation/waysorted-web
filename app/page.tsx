import { FloatingButton } from '@/components/FloatingButton'
import Header from '@/components/Header/index'
import Hero from '@/components/Hero/index'
import ImpactTop from '@/components/ImpactTop'
import { InfoCards } from '@/components/InfoCards'
import ToolsGrid from '@/components/ToolsGrid/index'
import TopSection from '@/components/TopSection/index'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <Header />
      <Hero />
      <ToolsGrid />
      <TopSection />
      <FloatingButton />
      <ImpactTop />
      <InfoCards />
    </main>
  )
}