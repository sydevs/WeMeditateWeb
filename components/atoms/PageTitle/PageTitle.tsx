import React from 'react'

export interface PageTitleProps {
  /** The main title text */
  title: string
  /** Optional subtitle text */
  subtitle?: string
  /** Text alignment (default: center) */
  align?: 'left' | 'center' | 'right'
  /** HTML heading level (default: h1) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * PageTitle component displays a prominent page heading with optional subtitle.
 * Based on the `.banner` element from wemeditate.com.
 *
 * @example
 * ```tsx
 * <PageTitle title="Meditate Now" />
 * <PageTitle title="About Us" subtitle="Learn more about our mission" align="left" />
 * ```
 */
export const PageTitle = ({
  title,
  subtitle,
  align = 'center',
  as: Component = 'h1',
}: PageTitleProps) => {
  // Mobile-first: all titles centered on smallest breakpoint, then apply alignment on sm+
  const alignmentClasses = {
    left: 'text-center sm:text-left',
    center: 'text-center',
    right: 'text-center sm:text-right',
  }

  // Gradient positioning based on alignment
  // Mobile: always centered gradient, Desktop: positioned based on alignment
  const gradientClasses = {
    left: 'before:left-0 before:bg-gradient-to-r before:w-1/2 sm:before:w-80',
    center: 'before:left-0 before:bg-gradient-to-r before:w-1/2',
    right: 'before:left-0 before:bg-gradient-to-r before:w-1/2 sm:before:right-0 sm:before:left-auto sm:before:bg-gradient-to-l sm:before:w-80',
  }

  return (
    <div
      className={`
        my-20 px-6 py-8 ${alignmentClasses[align]}
        relative
        before:absolute before:top-0 before:h-full
        before:from-transparent before:to-teal-200/30
        before:content-['']
        ${gradientClasses[align]}
        text-gray-700
      `}
    >
      <Component className="relative font-raleway text-4xl font-semibold tracking-wider">
        {title}
      </Component>
      {subtitle && (
        <p className="relative mt-4 font-raleway text-lg font-medium">
          {subtitle}
        </p>
      )}
    </div>
  )
}
