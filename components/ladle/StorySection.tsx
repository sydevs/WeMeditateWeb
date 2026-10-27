import type { ReactNode } from 'react'

/**
 * Unified StorySection component for consistent story structure in Ladle.
 *
 * Replaces StorySection, StoryDarkSection, StorySubsection, and StoryExampleSection
 * with a single flexible component that handles all use cases.
 *
 * @param title - Section title (renders as h2 for sections, p for subsections)
 * @param description - Optional description text below the title
 * @param children - The section content
 * @param surface - 'dark' renders the children on a dark surface; title and description stay light
 * @param background - Background style: 'none', 'neutral' (gray), or 'gradient' (teal)
 * @param variant - Section type: 'section', 'subsection', or 'scrollable'
 * @param inContext - When true, adds "In Context" prefix to title and bold top border
 */
export interface StorySectionProps {
  title: string
  description?: string
  children: ReactNode
  surface?: 'light' | 'dark'
  background?: 'none' | 'neutral' | 'gradient'
  variant?: 'section' | 'subsection' | 'scrollable'
  inContext?: boolean
}

export const StorySection = ({
  title,
  description,
  children,
  surface = 'light',
  background = 'none',
  variant = 'section',
  inContext = false,
}: StorySectionProps) => {
  /**
   * A dark ground is a `900` step, including both stops of the gradient, which
   * its lighter one governs: the dark surface draws `text-primary` as
   * `teal-300`, which clears 4.5:1 on `teal-900` and on nothing lighter (#179).
   *
   * `none` paints one too, because a dark surface without a ground drew white
   * text on the page's white background.
   */
  const getBackgroundStyles = () => {
    const baseStyles = 'p-6 rounded-lg'

    if (background === 'none') return surface === 'dark' ? 'bg-teal-900 p-6' : ''

    if (background === 'neutral') {
      return surface === 'dark' ? `bg-teal-900 ${baseStyles}` : `bg-gray-50 ${baseStyles}`
    }

    if (background === 'gradient') {
      return surface === 'dark'
        ? `bg-linear-to-b from-teal-900 to-coral-900 ${baseStyles}`
        : `bg-linear-to-b from-teal-50 to-teal-100 ${baseStyles}`
    }

    return ''
  }

  /**
   * The title and the description render in the wrapper, outside the ground
   * `renderContent()` paints, so both sit on the white page whatever the
   * surface is.
   */
  const getTitleColor = () => (variant === 'subsection' ? 'text-gray-800' : 'text-gray-900')

  const descriptionColor = 'text-gray-800'

  // Variant-specific configuration
  const variantConfig = {
    section: {
      tag: 'h2' as const,
      titleClass: 'text-lg font-semibold mb-4',
      showDivider: true,
      wrapperClass: '',
      isScrollable: false,
    },
    subsection: {
      tag: 'p' as const,
      titleClass: 'text-sm font-medium mb-3',
      showDivider: false,
      wrapperClass: 'mt-5',
      isScrollable: false,
    },
    scrollable: {
      tag: 'h2' as const,
      titleClass: 'text-lg font-semibold mb-4',
      showDivider: true,
      wrapperClass: '',
      isScrollable: true,
    },
  }

  const config = variantConfig[variant]
  const TitleTag = config.tag
  const titleColor = getTitleColor()
  const backgroundStyles = getBackgroundStyles()

  // Add "In Context - " prefix when inContext is true
  const displayTitle =
    inContext && title ? `In Context - ${title}` : inContext ? 'In Context' : title

  // Children of a dark section resolve every surface token against it
  const childrenSurfaceClass = surface === 'dark' ? 'surface-dark text-fg' : ''

  // For scrollable variant, wrap content in scrollable container
  const renderContent = () => {
    if (config.isScrollable) {
      // Determine border and background for scrollable container
      const borderColor = surface === 'dark' ? 'border-gray-700' : 'border-gray-200'
      // A dark surface always has a ground now, so only a light one falls back.
      const scrollBackground = backgroundStyles || 'bg-white'

      return (
        <div className={`h-[600px] overflow-y-auto border-4 ${borderColor}`}>
          <div className={`min-h-full px-6 ${scrollBackground} ${childrenSurfaceClass}`}>
            {children}
          </div>
        </div>
      )
    }

    // Regular content with optional background and text color
    if (backgroundStyles) {
      return <div className={`${backgroundStyles} ${childrenSurfaceClass}`}>{children}</div>
    }

    return <div className={childrenSurfaceClass}>{children}</div>
  }

  return (
    <>
      <div className={config.wrapperClass}>
        {/* Bold top border for "In Context" sections */}
        {inContext && <div className="border-t-4 border-gray-900 mb-6 pt-8" />}
        <TitleTag className={`${config.titleClass} ${titleColor}`}>{displayTitle}</TitleTag>
        {description && <p className={`text-sm ${descriptionColor} mb-4`}>{description}</p>}
        {renderContent()}
      </div>
      {config.showDivider && <hr className="border-gray-200" />}
    </>
  )
}
