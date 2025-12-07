'use client'

import React from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ToolBrief, { type ToolBriefProps } from '@/app/learning/[toolName]/components/ToolBrief'
import FeedbackRating from '@/components/Feedback'

gsap.registerPlugin(ScrollTrigger)

type ToolBriefCarouselProps = {
  slides: ToolBriefProps[]
  className?: string
  onFeedbackSubmit?: (rating: number, comment: string) => Promise<void> | void
  feedbackTitle?: string
  scroller?: string | HTMLElement
  debugMarkers?: boolean
}

export default function ToolBriefCarousel({
  slides,
  className,
  onFeedbackSubmit,
  feedbackTitle = 'Rate the way these slides helped you.',
  scroller,
  debugMarkers = false
}: ToolBriefCarouselProps) {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const slideRefs = React.useRef<HTMLElement[]>([])
  const rightSpacerRef = React.useRef<HTMLDivElement>(null)

  const [index, setIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const totalItems = slides.length + 1

  const registerSlideRef = (el: HTMLElement | null, i: number) => {
    if (el) slideRefs.current[i] = el
  }

  React.useLayoutEffect(() => {
    const sectionEl = sectionRef.current
    const trackEl = trackRef.current
    const slidesEls = slideRefs.current
    const rightSpacerEl = rightSpacerRef.current
    if (!sectionEl || !trackEl || slidesEls.length === 0 || !rightSpacerEl) return

    let scrollerEl: Element | Window | undefined
    if (typeof scroller === 'string') {
      scrollerEl = document.querySelector(scroller) ?? undefined
    } else if (scroller instanceof Element) {
      scrollerEl = scroller
    }

    const ctx = gsap.context(() => {
      const applyRightSpacer = () => {
        const viewportW = sectionEl.clientWidth
        const maxSlideW = Math.max(...slidesEls.map((s) => s.offsetWidth || 0), 0)
        const edgePx = Math.max(0, (viewportW - maxSlideW) / 2)
        rightSpacerEl.style.width = `${edgePx}px`
        // Force layout flush
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        trackEl.scrollWidth
      }

      const measure = () => {
        const viewportW = sectionEl.clientWidth
        const targetShifts = slidesEls.map((s) => {
          const centerX = s.offsetLeft + s.offsetWidth / 2
          return Math.max(0, centerX - viewportW / 2)
        })
        const endShift = Math.max(0, ...targetShifts)

        return { viewportW, targetShifts, endShift }
      }

      const setup = () => {
        applyRightSpacer()
        gsap.set(trackEl, { x: 0 })
        const { endShift } = measure()

        const tween = gsap.to(trackEl, {
          x: () => {
            applyRightSpacer()
            const { endShift: freshEnd } = measure()
            return -freshEnd
          },
          ease: 'none'
        })

        const st = ScrollTrigger.create({
          id: 'tool-brief-horizontal',
          trigger: sectionEl,
          animation: tween,
          start: 'top top',
          end: () => {
            applyRightSpacer()
            const { endShift: freshEnd } = measure()
            return `+=${freshEnd}`
          },
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scroller: scrollerEl,
          markers: debugMarkers,
          onRefreshInit: () => {
            applyRightSpacer()
            gsap.set(trackEl, { x: 0 })
          },
          ...(slidesEls.length > 1
            ? {
                snap: {
                  snapTo: (value: number) => {
                    applyRightSpacer()
                    const { targetShifts, endShift: freshEnd } = measure()
                    if (freshEnd <= 0) return 0
                    const points = targetShifts.map((s) => s / freshEnd)
                    return gsap.utils.snap(points, value)
                  },
                  duration: 0.25,
                  ease: 'power1.inOut'
                }
              }
            : {}),
          onUpdate: (self) => {
            setProgress(self.progress)
            const { viewportW, endShift: freshEnd } = measure()
            const x = -self.progress * freshEnd
            const viewportCenterX = -x + viewportW / 2

            let nearest = 0
            let nearestDist = Infinity
            for (let i = 0; i < slidesEls.length; i++) {
              const s = slidesEls[i]
              const centerX = s.offsetLeft + s.offsetWidth / 2
              const dist = Math.abs(centerX - viewportCenterX)
              if (dist < nearestDist) {
                nearest = i
                nearestDist = dist
              }
            }
            setIndex(nearest)
          }
        })

        return { st, tween }
      }

      const handles = setup()

      const doRefresh = () => ScrollTrigger.refresh()
      const onResize = () => {
        applyRightSpacer()
        doRefresh()
      }
      const onLoad = () => {
        applyRightSpacer()
        doRefresh()
      }

      window.addEventListener('resize', onResize)
      window.addEventListener('load', onLoad)

      const raf = requestAnimationFrame(() => {
        applyRightSpacer()
        doRefresh()
      })

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('load', onLoad)
        cancelAnimationFrame(raf)
        handles?.st?.kill()
        handles?.tween?.kill()
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [scroller, slides, debugMarkers])

  return (
    <div className={className}>
      <div
        ref={sectionRef}
        className="relative w-full overflow-hidden md:space-y-18 space-y-6 md:py-25 py-10"
        role="region"
        aria-roledescription="carousel"
        aria-label={`Carousel with ${totalItems} items including one feedback form at the end.`}
      >
        <div
          ref={trackRef}
          className="flex gap-10 items-center will-change-transform px-4 md:px-0"
        >
          {slides.map((props, i) => (
            <div
              key={i}
              ref={(el) => registerSlideRef(el, i)}
              className="shrink-0 max-w-none w-[475px] sm:w-[690px]"
              aria-label={`${i + 1} of ${totalItems}`}
              draggable={false}
            >
              <ToolBrief {...props} />
            </div>
          ))}

          {/* Final Feedback Slide */}
          <div
            key="feedback-slide"
            ref={(el) => registerSlideRef(el, totalItems - 1)}
            className="shrink-0 w-[min(100%,720px)] flex items-center justify-center"
            aria-label={`${totalItems} of ${totalItems} (Feedback)`}
            draggable={false}
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

          <div ref={rightSpacerRef} className="shrink-0" aria-hidden />
        </div>

        <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-10">
          <div className="mx-auto h-2 w-full max-w-7xl rounded-full bg-secondary-db-5/70">
            <div
              className="h-2 rounded-full bg-primary-way-20 transition-[width]"
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}