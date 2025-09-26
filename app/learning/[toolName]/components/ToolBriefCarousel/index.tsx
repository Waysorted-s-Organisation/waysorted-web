'use client'

import React from 'react'
import ToolBrief, { type ToolBriefProps } from '@/app/learning/[toolName]/components/ToolBrief'
import FeedbackRating from '@/components/Feedback'

type ToolBriefCarouselProps = {
  slides: ToolBriefProps[]
  className?: string
  onFeedbackSubmit?: (rating: number, comment: string) => Promise<void> | void
  feedbackTitle?: string
}

export default function ToolBriefCarousel({
  slides,
  className,
  onFeedbackSubmit,
  feedbackTitle = 'Rate the way these slides helped you.'
}: ToolBriefCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [index, setIndex] = React.useState(0)

  // Total items = all ToolBrief slides + 1 feedback slide
  const totalItems = slides.length + 1
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastIndex = totalItems - 1

  // Track scroll to update index
  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const handler = () => {
      const children = Array.from(el.children) as HTMLElement[]
      if (!children.length) return
      const centers = children.map((c) => {
        const rect = c.getBoundingClientRect()
        return Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2)
      })
      const nearest = centers.indexOf(Math.min(...centers))
      if (nearest !== -1 && nearest !== index) setIndex(nearest)
    }
    el.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    handler()
    return () => {
      el.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [index])

  return (
    <div className={className}>
      <div className="relative">
        {/* Scroll-snap row */}
        <div
          ref={scrollerRef}
            /* Added aria-label so assistive tech knows how many total "slides" including feedback */
          aria-label={`Carousel with ${totalItems} items including one feedback form at the end.`}
          className="no-scrollbar-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 md:px-0 scroll-px-4 md:scroll-px-0"
        >
          {slides.map((props, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[min(100%,720px)]"
              aria-label={`${i + 1} of ${totalItems}`}
            >
              <ToolBrief {...props} />
            </div>
          ))}

          {/* Final Feedback Slide */}
          <div
            key="feedback-slide"
            className="snap-center shrink-0 w-[min(100%,720px)] flex items-center justify-center"
            aria-label={`${totalItems} of ${totalItems} (Feedback)`}
          >
            <FeedbackRating
              title={feedbackTitle}
              onSubmit={async (rating, comment) => {
                try {
                  await onFeedbackSubmit?.(rating, comment)
                } catch (e) {
                  console.error('Error submitting feedback:', e)
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Progress rail (now includes feedback slide in the calculation) */}
      <div className="mx-auto my-8 h-1 w-full max-w-7xl rounded-full bg-secondary-db-5">
        <div
          className="h-2 rounded-full bg-primary-way-20 transition-all"
          style={{ width: `${((index + 1) / totalItems) * 100}%` }}
        />
      </div>
    </div>
  )
}