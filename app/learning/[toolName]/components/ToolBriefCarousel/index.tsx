'use client'

import React from 'react'
import ToolBrief, { type ToolBriefProps } from '@/app/learning/[toolName]/components/ToolBrief'

type ToolBriefCarouselProps = {
  slides: ToolBriefProps[]
  className?: string
}

export default function ToolBriefCarousel({ slides, className }: ToolBriefCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [index, setIndex] = React.useState(0)

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current
    if (!el) return
    const slide = el.children[i] as HTMLElement | undefined
    if (!slide) return
    slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const onPrev = () => {
    const next = Math.max(0, index - 1)
    setIndex(next)
    scrollToIndex(next)
  }
  const onNext = () => {
    const next = Math.min(slides.length - 1, index + 1)
    setIndex(next)
    scrollToIndex(next)
  }

  // Track scroll to update index
  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const handler = () => {
      const children = Array.from(el.children) as HTMLElement[]
      const centers = children.map((c) => {
        const rect = c.getBoundingClientRect()
        return Math.abs(rect.left + rect.width / 2 - (window.innerWidth / 2))
      })
      const nearest = centers.indexOf(Math.min(...centers))
      if (nearest !== -1) setIndex(nearest)
    }
    el.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    handler()
    return () => {
      el.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [])

  return (
    <div className={className}>
      <div className="relative">

        {/* Scroll-snap row of slides */}
        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 md:px-0 scroll-px-4 md:scroll-px-0"
        >
          {slides.map((props, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[min(100%,720px)]"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <ToolBrief {...props} />
            </div>
          ))}
        </div>
      </div>

      {/* Simple progress rail */}
      <div className="mx-auto my-8 h-1 w-full max-w-7xl rounded-full bg-secondary-db-5">
        <div
          className="h-2 rounded-full bg-primary-way-20 transition-all"
          style={{ width: `${((index + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  )
}