'use client'

import React from 'react'
import clsx from 'clsx'
import Image from 'next/image'

type FeedbackRatingProps = {
  className?: string
  onSubmit?: (rating: number, comment: string) => void
  title?: string
}

const RATING_EMOJIS = [
  { emoji: '😡', label: 'Very unsatisfied' },
  { emoji: '😐', label: 'Unsatisfied' },
  { emoji: '🙂', label: 'Neutral' },
  { emoji: '😍', label: 'Satisfied' },
  { emoji: '🤩', label: 'Very satisfied' }
]

export default function Feedback({ 
  className, 
  onSubmit,
  title = "Rate the way this slides helped you."
}: FeedbackRatingProps) {
  const [selectedRating, setSelectedRating] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleSubmit = async () => {
    if (selectedRating === null) return
    
    setIsSubmitting(true)
    
    try {
      await onSubmit?.(selectedRating, comment)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className={clsx(
        'w-full max-w-[690px] mx-auto p-8 text-center',
        'rounded-4xl bg-white ring-1 ring-secondary-db-5',
        className
      )}>
        <div className="">
            <Image
                src="/icons/success.svg"
                alt="Thank You"
                width={64}
                height={64}
                className="mx-auto mb-4"
            />
        </div>
        <h3 className="text-xl font-medium text-secondary-db-100 mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-secondary-db-80 text-sm">
          Your input helps us improve our content.
        </p>
      </div>
    )
  }

  return (
    <div className={clsx(
      'w-full max-w-[690px] h-[360px] md:h-[350px] lg:h-[382px] mx-auto p-8',
      'rounded-4xl bg-white',
      className
    )}>
      <h3 className="text-2xl font-medium text-secondary-db-100 text-center mb-8">
        {title}
      </h3>

      {/* Rating Emojis */}
      <div className="flex justify-center gap-4 mb-8">
        {RATING_EMOJIS.map((item, index) => (
          <button
            key={index}
            onClick={() => setSelectedRating(index)}
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all',
              'hover:scale-110 focus:outline-none cursor-pointer',
              selectedRating === index 
                ? 'bg-primary-way-100 scale-110' 
                : 'bg-secondary-db-5 hover:bg-primary-way-10'
            )}
            aria-label={`${item.label} - Rating ${index + 1} out of 5`}
            type="button"
          >
            <span className={clsx(
              selectedRating === index ? 'grayscale-0' : 'grayscale opacity-60'
            )}>
              {item.emoji}
            </span>
          </button>
        ))}
      </div>

      {/* Comment Box */}
      <div className="mb-6">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="(Optional) If you have additional comments..."
          className={clsx(
            'w-full min-h-[100px] p-4 rounded-lg resize-none',
            'bg-secondary-db-5',
            'placeholder:secondary-db-60 text-sm',
            'focus:outline-none focus:ring-1 focus:ring-primary-way-100 focus:border-transparent',
            'transition-colors'
          )}
          maxLength={500}
        />
      </div>

      {/* User Info and Submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-9 h-9 rounded-lg bg-primary-way-20 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-way-60" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium text-secondary-db-100">Guest</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedRating === null || isSubmitting}
          className={clsx(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all',
            selectedRating === null
              ? 'bg-secondary-db-5 text-gray-400 cursor-not-allowed'
              : 'bg-secondary-db-100 text-white active:scale-95 cursor-pointer'
          )}
        >
          {isSubmitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>
    </div>
  )
}