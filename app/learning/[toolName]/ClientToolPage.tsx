'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useBanner } from '@/context/BannerContext'
import Header from '@/components/Header'
import ToolBriefCarousel from './components/ToolBriefCarousel'
import JoinCommunity from '@/components/JoinCommunity'
import ExploreMore from './components/ExploreMore'
import Footer from '@/components/Footer'
import type { ITool, ISlide } from '@/models/tool'

interface ClientToolPageProps {
  initialTool: ITool | null
  toolName: string
  initialSlides?: ISlide[]
  initialTools?: ITool[]
}

export default function ClientToolPage({
  initialTool,
  toolName,
  initialSlides = [],
  initialTools = [],
}: ClientToolPageProps) {
  const { showBanner, setShowBanner } = useBanner()

  // Seeded from the server so the slides and the "Explore More" links are in the
  // initial HTML. They used to be fetched from /api/tools/*, which robots.txt
  // disallows, so crawlers never saw them.
  const [tool, setTool] = useState<ITool | null>(initialTool)
  const [slides, setSlides] = useState<ISlide[]>(initialSlides)
  const [allTools, setAllTools] = useState<ITool[]>(initialTools)
  const [loading, setLoading] = useState(!initialTool)

  useEffect(() => {
    let mounted = true

    async function fetchData() {
      // If we didn't have initial tool, or just want to refresh:
      // But typically with SSR we trust initialTool.
      // However, we still need `slides` and `allTools` (ExploreMore).
      // So we fetch those.
      // If initialTool is provided, we don't need to fetch it again necessarily, 
      // but the original code fetched /api/tools/active to find the tool.

      setLoading(true)
      try {
        const [toolsRes, slidesRes] = await Promise.all([
          fetch('/api/tools/active'),
          toolName ? fetch(`/api/tools/${encodeURIComponent(toolName)}/slides`) : Promise.resolve(null)
        ])

        if (!mounted) return

        const toolsJson = await toolsRes.json()
        const toolsData: ITool[] = toolsJson?.data ?? []
        setAllTools(toolsData)

        // If we didn't have initialTool, find it now
        if (!initialTool) {
          const foundTool = toolsData.find((t: ITool) => t.slug === toolName)
          setTool(foundTool ?? null)
        }

        if (slidesRes) {
          const slidesJson = await slidesRes.json()
          if (!mounted) return
          setSlides(slidesJson?.slides ?? [])
        } else {
          setSlides([])
        }
      } catch (error) {
        if (!mounted) return
        console.error('Error fetching tool or slides data:', error)
        if (!initialTool) setTool(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const alreadyHydrated =
      Boolean(initialTool) && initialSlides.length > 0 && initialTools.length > 0

    if (toolName && !alreadyHydrated) {
      fetchData()
    } else if (toolName) {
      setLoading(false)
    } else {
      setTool(null)
      setSlides([])
      setAllTools([])
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [toolName, initialTool, initialSlides, initialTools])

  if (!tool && !loading) {
    return null
  }

  return (
    <div>
      <main
        className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? 'pt-24' : 'pt-16'
          }`}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-5 my-6 sm:my-16">
          {/* Crawlable <Link>s, and db-70 instead of the /50 opacity blend
              (3.55:1) so breadcrumb text clears WCAG AA. */}
          <nav aria-label="Breadcrumb" className="text-base font-medium text-secondary-db-70">
            <Link
              href="/"
              className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
            >
              Home
            </Link>
            <Image
              src="/icons/chevron-right.svg"
              alt="Arrow Right"
              width={5}
              height={7}
              className="inline-block mx-2"
            />
            <Link
              href="/learning"
              className="text-secondary-db-70 text-base font-medium hover:text-secondary-db-100 cursor-pointer hover:border-b-2 hover:border-b-primary-way-100"
            >
              Learning Hub
            </Link>
            <Image
              src="/icons/chevron-right.svg"
              alt="Arrow Right"
              width={5}
              height={7}
              className="inline-block mx-2"
            />
            <span className="text-primary-way-100 text-base font-medium cursor-pointer">
              {tool?.name ?? toolName}
            </span>
          </nav>
        </div>

        {/* Heading */}
        <div className="max-w-7xl mx-auto px-4 sm:px-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 sm:gap-16 mt-8 sm:mt-12">
          <div className="w-full lg:max-w-3xl text-left">
            <h1 className="text-[36px] font-semibold text-secondary-db-100 leading-tight">
              {tool?.heading ?? ''}
            </h1>
            <button className="bg-secondary-db-100 text-white mt-8 py-3.5 px-8 font-semibold text-base rounded-full cursor-pointer hover:bg-secondary-db-90 transition-colors">
              Try now for free
            </button>
          </div>

          <div className="w-full lg:max-w-lg mt-2 lg:mt-4">
            <p className="text-secondary-db-100 text-lg sm:text-xl font-medium leading-relaxed">
              {tool?.tagline ?? ''}
            </p>
          </div>
        </div>

        {/* Carousel of ToolBriefs */}
        <div className="my-0 sm:my-10">
          <div className="mx-auto max-w-7xl px-5">
            {slides.length > 0 && <ToolBriefCarousel slides={slides} />}
            {loading && <p className="text-center">Loading slides…</p>}
          </div>
        </div>

        <ExploreMore tools={allTools} />
        <JoinCommunity />
      </main>
      <Footer />
    </div>
  )
}
