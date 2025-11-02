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
  /** Size variant - md or lg */
  size?: 'md' | 'lg'
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
  size = 'lg',
  className = '',
}) => {
  const alignmentClass = align === 'center' ? 'text-center' : 'text-left'

  // Size-specific styling
  const isMd = size === 'md'
  const dividerMaxWidth = isMd ? '' : 'max-w-sm' // lg: ~400px = max-w-sm (384px)
  const blockquoteMaxWidth = isMd ? 'max-w-sm' : 'max-w-2xl' // md: 384px, lg: 672px
  const textSize = isMd ? 'text-lg' : 'text-2xl' // md: 18px, lg: 24px (closest to 23px)
  const lineHeight = isMd ? 'leading-relaxed' : 'leading-relaxed' // both 1.625
  const verticalSpacing = isMd ? 'my-12' : 'my-18 md:my-20'
  const horizontalMargin = isMd ? 'mx-0' : 'mx-16'
  const dividerSpacing = isMd ? 'mb-8' : 'mb-10.5'
  const dividerSpacingBottom = isMd ? 'mt-8' : 'mt-10.5'

  return (
    <blockquote
      className={`${blockquoteMaxWidth} ${verticalSpacing} ${horizontalMargin} ${alignmentClass} font-raleway text-gray-dark mx-auto ${className}`}
      role="region"
      aria-label={title || 'Quote'}
    >
      {/* Top leaf divider */}
      <div className={`relative ${dividerSpacing} ${dividerMaxWidth} mx-auto`}>
        <LeafDivider showLine direction="up" />
      </div>

      {/* Optional title */}
      {title && (
        <h5 className="text-lg font-semibold leading-relaxed mb-4">
          {title}
        </h5>
      )}

      {/* Main quote text */}
      <div className={`${textSize} ${lineHeight} mb-4`}>
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
        <p className="text-sm leading-normal mt-2 italic text-gray-500">
          {caption}
        </p>
      )}

      {/* Bottom leaf divider */}
      <div className={`relative ${dividerSpacingBottom} ${dividerMaxWidth} mx-auto`}>
        <LeafDivider showLine direction="down" />
      </div>
    </blockquote>
  )
}

export default HeroQuote
