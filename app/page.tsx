import { FloatingButton } from '@/components/FloatingButton'
import Header from '@/components/Header/index'
import Hero from '@/components/Hero/index'
import ToolsGrid from '@/components/ToolsGrid/index'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <Header />
      <Hero />
      <ToolsGrid />
      <FloatingButton />
    </main>
  )
}