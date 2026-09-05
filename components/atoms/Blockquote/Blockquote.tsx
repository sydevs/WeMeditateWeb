import React from 'react'

export interface BlockquoteProps {
  /** The quote text content */
  text: string
  /** Optional credit/attribution for the quote */
  credit?: string
  /** Alignment of the blockquote. Affects gradient direction and text alignment. */
  align?: 'left' | 'right'
  /** Additional CSS classes */
  className?: string
}

/**
 * Blockquote is an atom: a floating quote component with a gradient background.
 *
 * It is a typography atom for displaying quotes with optional attribution.
 * It features semi-transparent gradient backgrounds that adapt to alignment.
 *
 * @example
 * ```tsx
 * <Blockquote
 *   text="This Kundalini is the spiritual mother of every individual."
 *   credit="Shri Mataji Nirmala Devi"
 *   align="right"
 * />
 * ```
 */
export function Blockquote({ text, credit, align = 'right', className = '' }: BlockquoteProps) {
  const isLeft = align === 'left'

  return (
    <div
      className={`
        relative max-w-sm sm:max-w-md lg:max-w-lg
        ${isLeft ? 'float-left' : 'float-right'}
        ${className}
      `.trim()}
    >
      <blockquote
        className={`
          relative
          max-w-100
          m-8 px-8 py-4 sm:py-8
          ${isLeft ? 'pl-16 -ml-12 text-right' : 'pr-16 -mr-12 text-left'}
          before:content-[''] before:absolute before:inset-0 before:-z-10
          leading-relaxed text-gray-600
          ${
            isLeft
              ? 'before:left-0 before:right-[20%] before:bg-linear-to-r'
              : 'before:left-[20%] before:right-0 before:bg-linear-to-l'
          }
          before:from-transparent before:to-teal-200/30
        `.trim()}
      >
        <div className={`text-base font-medium`}>
          <p>{text}</p>
        </div>
        {credit && <div className={`mt-4 text-sm font-light`}>{credit}</div>}
      </blockquote>
    </div>
  )
}
