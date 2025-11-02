import React from 'react'
import { LeafDivider } from '../../../atoms/LeafDivider/LeafDivider'

export interface HeroQuoteProps {
  /** The main quote text (required) */
  text: string
  /** Optional title displayed above the quote */
  title?: string
  /** Optional credit/attribution text */
  credit?: string
  /** Optional caption displayed after the credit */
  caption?: string
  /** Text alignment - left or center */
  align?: 'left' | 'center'
  /** Additional CSS classes */
  className?: string
}

/**
 * HeroQuote component displays a prominent quote block with decorative leaf dividers.
 * Used to feature large quote content within rich text content sections.
 *
 * Features:
 * - Large, centered quote text
 * - Optional title heading
 * - Optional credit/attribution
 * - Optional caption
 * - Decorative leaf dividers at top and bottom
 *
 * @example
 * ```tsx
 * <HeroQuote
 *   title="World Mental Health Day"
 *   text="Since 1992, October 10th has been marked globally..."
 * />
 * ```
 *
 * @example
 * ```tsx
 * <HeroQuote
 *   text="If you are a scientist, then you must keep your mind opened out..."
 *   credit="Shri Mataji, Founder of Sahaja Yoga, Public Program in London, 1978"
 * />
 * ```
 */
export const HeroQuote: React.FC<HeroQuoteProps> = ({
  text,
  title,
  credit,
  caption,
  align = 'center',
  className = '',
}) => {
  const alignmentClass = align === 'center' ? 'text-center' : 'text-left'

  return (
    <div
      className={`px-6 md:px-24 lg:px-[313px] ${className}`}
      role="region"
      aria-label={title || 'Quote'}
    >
      <blockquote className={`my-18 md:my-20 mx-16 ${alignmentClass} font-raleway text-gray-dark`}>
        {/* Top leaf divider */}
        <div className="relative mb-10.5">
          <LeafDivider showLine direction="up" />
        </div>

        {/* Optional title */}
        {title && (
          <h5 className="text-lg font-semibold leading-relaxed mb-4">
            {title}
          </h5>
        )}

        {/* Main quote text */}
        <div className="text-[23px] leading-[36.8px] mb-4">
          <p>{text}</p>
        </div>

        {/* Optional credit */}
        {credit && (
          <cite className="text-lg leading-relaxed not-italic block">
            {credit}
          </cite>
        )}

        {/* Optional caption */}
        {caption && (
          <p className="text-base leading-normal mt-2">
            {caption}
          </p>
        )}

        {/* Bottom leaf divider */}
        <div className="relative mt-10.5">
          <LeafDivider showLine direction="down" />
        </div>
      </blockquote>
    </div>
  )
}

export default HeroQuote
