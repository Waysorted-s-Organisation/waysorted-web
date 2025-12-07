"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function FloatingButton() {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true) // pill visible
  const [previewOpen, setPreviewOpen] = useState(false) // expanded preview state
  const [footerVisible, setFooterVisible] = useState(false) // whether footer is in viewport

  // Scroll handling: hide pill + preview on scroll past threshold
  useEffect(() => {
    const onScroll = () => {
      const hasScrolled = window.scrollY > 100
      setScrolled(hasScrolled)
      if (hasScrolled) {
        setVisible(false)
        setPreviewOpen(false)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Observe footer visibility to hide floating button when footer is visible
  useEffect(() => {
    if (typeof window === "undefined") return

    const footerEl =
      document.querySelector("#site-footer")

    if (!footerEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // when footer is at least partially visible, hide the floating button
          setFooterVisible(entry.isIntersecting)
        })
      },
      {
        root: null,
        threshold: 0, // any intersection -> considered visible
      }
    )

    observer.observe(footerEl)

    return () => {
      observer.disconnect()
    }
  }, [])

  // If footer is visible, don't render the floating button
  if (footerVisible) return null

  // UPDATED: Calculate width dynamically for mobile to fit screen minus button/padding,
  // but keep fixed w-80 for desktop (md:w-80)
  const baseWidthClass = 'w-[calc(100vw-8rem)] md:w-80'

  const handleFloatingClick = () => {
    setVisible(true)
    // don't auto-open preview; hover/focus will open it
  }

  return (
    <>
      {/* UPDATED: Adjusted positioning for mobile (bottom-4 right-4) vs desktop (bottom-8 right-8) */}
      <div id="floating-button" className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex items-end gap-3">
        {/* When visible, render the independent close button (left) + wrapper (right) */}
        {visible && (
          <div
            className={`flex items-center gap-2 bg-white p-1 shadow-lg border border-gray-200 ${
              previewOpen ? 'rounded-2xl' : 'rounded-full'
            } transition-all duration-300 ease-in-out`}
          >
            {/* Independent close button - NOT part of the wrapper.
                Visible only when pill is visible and preview is closed. */}
            {!previewOpen && (
              <button
                onClick={() => {
                  setVisible(false)
                  setPreviewOpen(false)
                }}
                title="Hide pill"
                className="w-6 h-6 rounded-full flex items-center justify-center border border-[#ADADAD] hover:bg-gray-100 cursor-pointer flex-shrink-0"
                aria-label="Hide pill"
              >
                <Image src="/icons/close-1.svg" alt="Close" width={7} height={7} />
              </button>
            )}

            {/* Pill/Preview wrapper - hovering/focus inside this opens the preview.
                Because the close button is outside, it will not trigger preview toggling. */}
            <div
              // wrapper keeps preview inside same DOM area to avoid hover-leave glitches
              onMouseEnter={() => setPreviewOpen(true)}
              onMouseLeave={() => setPreviewOpen(false)}
              onFocus={() => setPreviewOpen(true)}
              onBlur={() => setPreviewOpen(false)}
              // UPDATED: Added onClick to allow "tap to open" on mobile devices where hover doesn't exist
              onClick={() => setPreviewOpen(true)}
              className="relative"
            >
              {/* Morphing box: same width always, height and rounding animate */}
              <div
                className={`${baseWidthClass} overflow-hidden bg-white transform transition-all duration-300 ease-in-out
                  ${previewOpen ? 'h-44 rounded-2xl p-4' : 'h-10 rounded-full px-3 py-2'}`}
              >
                {/* COLLAPSED LAYER (PILL CONTENT) */}
                <div
                  className={`absolute inset-0 flex items-center gap-2 transition-all duration-200 transform
                    ${previewOpen ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}`}
                >
                  <p className="text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-full cursor-default">
                    Export your Figma designs directly to PDFs.
                  </p>
                </div>

                {/* EXPANDED LAYER (PREVIEW) */}
                <div
                  className={`absolute inset-0 flex flex-col transform p-2
                    ${previewOpen ? 'opacity-100 pointer-events-auto spring-up' : 'opacity-0 pointer-events-none spring-down'}`}
                  // no mouse handlers here — handled at wrapper level
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Release Notes !</h4>

                    {/* Close inside preview (closes preview only) */}
                    {/* Note: onClick propagation needs to be stopped if we don't want the wrapper onClick to immediately reopen it, 
                        but since setPreviewOpen(false) is called here, it usually wins or React event bubbling order handles it. 
                        Adding e.stopPropagation() is safer for the close button. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewOpen(false);
                      }}
                      aria-label="Close preview"
                      className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center border border-[#ADADAD] cursor-pointer"
                    >
                      <Image src="/icons/close-1.svg" alt="Close" width={7} height={7} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 mt-2">
                    Export your Figma designs directly to high-quality PDFs.
                  </p>

                  <div className="mt-3 flex-1 bg-purple-700 rounded-lg" aria-hidden>
                    {/* Replace with next/image or real preview content */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating blue button */}
        <button
          onClick={handleFloatingClick}
          title="Floating action"
          className="w-12 h-12 rounded-full bg-primary-way-100 flex items-center justify-center shadow-lg cursor-pointer flex-shrink-0"
          aria-label="Open pill"
        >
          <Image src="/icons/floating-button.svg" alt="Open" width={22} height={22} />
        </button>
      </div>
    </>
  )
}