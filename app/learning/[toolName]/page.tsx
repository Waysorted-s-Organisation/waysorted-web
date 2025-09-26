'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import ToolsData from '@/app/learning/data/index'
import { useBanner } from '@/context/BannerContext'
import Header from '@/components/Header'
import ToolBriefCarousel from './components/ToolBriefCarousel'
import allSlides from "@/app/learning/[toolName]/data/index"
import type { SlideData, SlideWithoutToolName } from "@/app/learning/types/index"
import JoinCommunity from '@/components/GetStarted'
import ExploreMore from './components/ExploreMore'
import Footer from "@/components/Footer";

// NOTE: params is not a Promise in Next.js app router pages.
export default function LearnMorePage({ params }: { params: { toolName: string } }) {
  const [isGridView, setIsGridView] = React.useState(true)
  const { showBanner, setShowBanner } = useBanner()
  const router = useRouter()

  const { toolName } = params
  const tool = ToolsData.find((t) => t.slug === toolName)

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Tool not found
      </div>
    )
  }

  const slides: SlideWithoutToolName[] = (allSlides as SlideData[])
    .filter((s: SlideData) => s.toolName === toolName)
    .map(({ toolName: _ignore, ...rest }: SlideData) => rest)  

  return (
    <div>
      <main
        className={`min-h-screen bg-white transition-all duration-300 ${
          showBanner ? 'pt-24' : 'pt-16'
        }`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-5 my-16">
          <nav className="text-base font-medium text-secondary-db-100/50">
            <span
              className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
              onClick={() => router.push('/')}
            >
              Home
            </span>
            <Image
              src="/icons/chevron-right.svg"
              alt="Arrow Right"
              width={4}
              height={4}
              className="inline-block mx-2"
            />
            <span
              className="text-secondary-db-100/50 text-base font-medium hover:text-secondary-db-100 cursor-pointer hover:border-b-2 hover:border-b-primary-way-100"
              onClick={() => router.push('/learning')}
            >
              Learning
            </span>
            <Image
              src="/icons/chevron-right.svg"
              alt="Arrow Right"
              width={4}
              height={4}
              className="inline-block mx-2"
            />
            <span className="text-primary-way-100 text-base font-medium cursor-pointer">
              {tool.name}
            </span>
          </nav>
        </div>

        {/* Heading */}
        <div className="max-w-7xl mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-6xl w-lg font-medium text-secondary-db-100 leading-tight">
              Explore Every <span className="text-primary-way-100">Shade</span> with Ease
            </h1>
            <div>
              <button className="bg-secondary-db-100 text-white my-8 py-3 px-7 font-semibold text-base rounded-full cursor-pointer">
                Try now for free
              </button>
            </div>
          </div>

          <p className="text-secondary-db-100 max-w-sm mt-16 text-xl font-medium">
            Generate customizable color palettes from a base color, apply variations like brightening
            or hue shifts, and evaluate accessibility compliance
            <span className="text-secondary-db-70">—all in one tool.</span>
          </p>
        </div>

        {/* Carousel of ToolBriefs */}
        <div className="my-10">
          <div className="mx-auto max-w-7xl px-5">
            <ToolBriefCarousel slides={slides} />
          </div>
        </div>
        <ExploreMore  tools={ToolsData} />
        <JoinCommunity />
        
      </main>
      <Footer />
    </div>
  )
}