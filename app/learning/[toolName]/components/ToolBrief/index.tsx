'use client'

import Image, { StaticImageData } from 'next/image'
import React from 'react'
import clsx from 'clsx'

export type ToolBriefProps = {
  title: string
  subtitle?: string
  bullets?: string[]
  image: StaticImageData | string
  imageAlt?: string
  className?: string
}

export default function ToolBrief({
  title,
  subtitle,
  bullets = [],
  image,
  imageAlt = '',
  className = '',
}: ToolBriefProps) {
  return (
    <section
      className={clsx(
        // Overall container sizing to match the mock: wide and shallow (16:9-ish)
        // Height scales a bit by breakpoint but stays compact like your image.
        'w-full max-w-[690px] h-[360px] md:h-[350px] lg:h-[382px]',
        'rounded-4xl overflow-hidden',
        'ring-1 ring-black/5 bg-black/5',
        className
      )}
      aria-label={title}
    >
      {/* Two-column layout: ~60/40 split to mirror the screenshot */}
      <div className="grid h-full grid-cols-1 md:grid-cols-[3fr_2fr]">
        {/* Left: dotted background with card image */}
        <div className="relative bg-tool-brief">
          {/* Image card with a slight inset and drop shadow */}
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
            />
        </div>

        {/* Right: dark content panel */}
        <div className="bg-secondary-db-100 text-white p-6 md:p-8 lg:p-9">
          <h3 className="text-2xl font-medium">{title}</h3>

          {subtitle ? (
            <p className="mt-6 text-secondary-db-20 text-sm font-regular">{subtitle}</p>
          ) : null}

          {bullets.length > 0 ? (
            <ul className="mt-6 space-y-3 list-disc pl-5 marker:text-secondary-db-20 marker:text-sm">
              {bullets.map((line, i) => (
                <li key={i} className="text-secondary-db-20 text-sm font-regular">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}