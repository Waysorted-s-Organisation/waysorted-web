'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useBanner } from '@/context/BannerContext'
import Header from '@/components/Header'
import ToolBriefCarousel from './components/ToolBriefCarousel'
import JoinCommunity from '@/components/GetStarted'
import ExploreMore from './components/ExploreMore'
import Footer from '@/components/Footer'
import type { ITool, ISlide } from '@/models/tool'

export default function LearnMorePage({ params }: { params: { toolName: string } }) {
  const { showBanner, setShowBanner } = useBanner()
  const router = useRouter()
  const { toolName } = params

  const [tool, setTool] = useState<ITool>()
  const [slides, setSlides] = useState<ISlide[]>([])
  const [allTools, setAllTools] = useState<ITool[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const toolsRes = await fetch('/api/tools/active')
        const toolsJson = await toolsRes.json()
        setAllTools(toolsJson.data || [])

        // Find the tool by slug (toolName)
        const foundTool = (toolsJson.data || []).find((t: ITool) => t.slug === toolName)
        setTool(foundTool || null)

        const slidesRes = await fetch(`/api/tools/${toolName}/slides`);
        const slidesJson = await slidesRes.json();
        setSlides(slidesJson.slides || []);
      } catch (err) {
        setSlides([])
      } finally {
      }
    }
    fetchData()
  }, [toolName])
  if(!tool) {
    console.log("Tool not found for slug:", toolName);
  }

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
              {tool?.name}
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
              <button className="bg-secondary-db-100 text-white my-8 py-3 px-7 font-semibold text-base rounded-full cursor-pointer hover:bg-secondary-db-90">
                Try now for free
              </button>
            </div>
          </div>

          <p className="text-secondary-db-100 max-w-lg mt-16 text-xl font-medium">
            {tool?.description}
            <span className="text-secondary-db-70">—all in one tool.</span>
          </p>
        </div>

        {/* Carousel of ToolBriefs */}
        <div className="my-10">
          <div className="mx-auto max-w-7xl px-5">
            {slides.length > 0 && (
              <ToolBriefCarousel slides={slides} />
            )}
          </div>
        </div>
        <ExploreMore tools={allTools} />
        <JoinCommunity />
      </main>
      <Footer />
    </div>
  )
}