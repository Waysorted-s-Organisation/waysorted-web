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
        // Responsive container
        'w-full max-w-[95vw] sm:max-w-[690px] h-[220px] sm:h-[350px] lg:h-[382px]',
        'rounded-3xl sm:rounded-4xl overflow-hidden',
        'ring-1 ring-black/5 bg-black/5',
        className
      )}
      aria-label={title}
    >
      {/* Always horizontal layout, both sides 50% */}
      <div className="flex flex-row h-full">
        {/* Left: image, rounded on left only */}
        <div className="relative w-1/2 h-full bg-tool-brief rounded-l-3xl sm:rounded-l-4xl overflow-hidden">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Right: content, rounded on right only */}
        <div className="w-1/2 h-full bg-secondary-db-100 text-white p-4 sm:p-8 lg:p-9 rounded-r-3xl sm:rounded-r-4xl flex flex-col justify-center">
          <h3 className="text-lg sm:text-2xl font-medium">{title}</h3>
          {subtitle ? (
            <p className="mt-2 sm:mt-6 text-secondary-db-20 text-xs sm:text-sm font-regular">{subtitle}</p>
          ) : null}
          {bullets.length > 0 ? (
            <ul className="mt-2 sm:mt-6 space-y-2 sm:space-y-3 list-disc pl-5 marker:text-secondary-db-20 marker:text-xs sm:marker:text-sm">
              {bullets.map((line, i) => (
                <li key={i} className="text-secondary-db-20 text-xs sm:text-sm font-regular">
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