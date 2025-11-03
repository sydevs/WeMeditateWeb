import React from 'react'
import { LeafSvg } from '../svgs'

export interface LeafDividerProps {
  /** Whether to show the divider line */
  showLine?: boolean
  /** Direction of the leaf decoration (up or down) */
  direction?: 'up' | 'down'
  /** Additional CSS classes */
  className?: string
}

/**
 * LeafDivider component provides a decorative divider with leaf ornaments.
 * Used to separate content sections with an elegant botanical accent.
 *
 * @example
 * ```tsx
 * <LeafDivider showLine direction="up" />
 * ```
 */
export const LeafDivider: React.FC<LeafDividerProps> = ({
  showLine = true,
  direction = 'up',
  className = '',
}) => {
  // Leaf height is 32px (h-8), so we need that much margin
  return (
    <div
      className={`relative w-full text-center ${
        direction === 'up' ? 'pt-8' : 'pb-8'
      } ${className}`}
      role="separator"
      aria-hidden="true"
    >
      {/* The line at the base of the leaf */}
      {showLine && (
        <div
          className={`w-full border-t border-gray-light absolute ${
            direction === 'up' ? 'bottom-0' : 'top-0'
          }`}
        />
      )}

      {/* Leaf icon centered and positioned at the line */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bg-white px-2 text-gray-dark ${
          direction === 'up'
            ? 'bottom-0'
            : 'top-0 rotate-180'
        }`}
      >
        <LeafSvg />
      </div>
    </div>
  )
}

export default LeafDivider
