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

  // Drag state
  const [isDragging, setIsDragging] = React.useState(false)
  const dragRef = React.useRef<{
    startX: number
    startScrollLeft: number
    pointerId: number | null
    moved: boolean
  }>({ startX: 0, startScrollLeft: 0, pointerId: null, moved: false })

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

  // Mouse-drag handlers (keep touch/trackpad native)
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Only enable custom dragging for mouse; touch/pen keep native scrolling
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current.startX = e.clientX
    dragRef.current.startScrollLeft = el.scrollLeft
    dragRef.current.pointerId = e.pointerId
    dragRef.current.moved = false
    setIsDragging(true)
    el.setPointerCapture(e.pointerId)
    // Prevent text selection on drag start
    // (We still avoid preventDefault on touch to keep native momentum)
    e.preventDefault()
  }

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return
    if (dragRef.current.pointerId !== e.pointerId) return
    const el = scrollerRef.current
    if (!el) return
    // Calculate delta from starting point
    const dx = e.clientX - dragRef.current.startX
    if (Math.abs(dx) > 2) dragRef.current.moved = true
    // Scroll opposite to drag direction
    el.scrollLeft = dragRef.current.startScrollLeft - dx
    // Prevent selecting text/images while dragging
    e.preventDefault()
  }

  const endDrag = React.useCallback(() => {
    if (!isDragging) return
    const el = scrollerRef.current
    if (el && dragRef.current.pointerId != null) {
      try {
        el.releasePointerCapture(dragRef.current.pointerId)
      } catch {
        // no-op if not captured
      }
    }
    dragRef.current.pointerId = null
    setIsDragging(false)
  }, [isDragging])

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    endDrag()
  }

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    endDrag()
  }

  // Prevent default browser drag (e.g., images) which interferes with mouse-drag scrolling
  const onDragStart: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
  }

  // Optional: keyboard support to move between slides
  const scrollToChild = (i: number) => {
    const el = scrollerRef.current
    if (!el) return
    const child = el.children[i] as HTMLElement | undefined
    if (!child) return
    child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = Math.min(index + 1, totalItems - 1)
      scrollToChild(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = Math.max(index - 1, 0)
      scrollToChild(prev)
    }
  }

  return (
    <div className={className}>
      <div className="relative">
        {/* Scroll-snap row */}
        <div
          ref={scrollerRef}
          /* Added aria-label so assistive tech knows how many total "slides" including feedback */
          aria-label={`Carousel with ${totalItems} items including one feedback form at the end.`}
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onDragStart={onDragStart}
          // Keep native touch/trackpad pan; we only handle mouse drag
          style={{
            touchAction: 'pan-y',
            // Disable snap while actively dragging for smoother feel
            scrollSnapType: isDragging ? 'none' : 'x mandatory'
          }}
          className={`no-scrollbar-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 md:px-0 scroll-px-4 md:scroll-px-0 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
        >
          {slides.map((props, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[min(100%,720px)]"
              aria-label={`${i + 1} of ${totalItems}`}
              draggable={false}
            >
              <ToolBrief {...props} />
            </div>
          ))}

          {/* Final Feedback Slide */}
          <div
            key="feedback-slide"
            className="snap-center shrink-0 w-[min(100%,720px)] flex items-center justify-center"
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