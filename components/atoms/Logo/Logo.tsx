import { ComponentProps } from 'react'
import { Link } from '../Link'
import { LogoSvg } from '../svgs'

export interface LogoProps extends Omit<ComponentProps<'a'>, 'href' | 'children'> {
  /** Logo variant */
  variant?: 'icon' | 'square' | 'circle' | 'text'
  /** Size of the logo */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Text alignment (only applies to text variant) */
  align?: 'left' | 'center' | 'right'
  /** Link destination (if undefined, renders as div instead of link) */
  href?: string
}

/**
 * Logo component with multiple variants for different contexts.
 * - icon: Just the lotus icon
 * - text: Icon above text "We meditate" (stacked vertically)
 * - square: Icon in a colored square container
 * - circle: Icon in a colored circular container
 */
export function Logo({
  variant = 'text',
  size = 'md',
  align = 'center',
  href,
  className = '',
  ...props
}: LogoProps) {
  // Size configurations for different elements
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const buttonSizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-5',
  }

  // Base styles for all variants
  const baseStyles = 'inline-flex'

  // Variant-specific styles
  let variantStyles = ''
  let content = null

  if (variant === 'icon') {
    variantStyles = href ? 'hover:opacity-80 transition-opacity' : ''
    content = <LogoSvg className={iconSizes[size]} />
  } else if (variant === 'text') {
    // Stacked: icon above text "We meditate"
    const alignmentStyles = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right',
    }

    // For left/right alignment, add line breaks to make "We meditate" multiline
    const textContent = align === 'center' ? 'We meditate' : 'We\nmeditate'

    variantStyles = `flex-col gap-1 ${alignmentStyles[align]} ${href ? 'no-underline hover:opacity-80 transition-opacity' : ''}`
    content = (
      <>
        <LogoSvg className={iconSizes[size]} />
        <span className={`font-normal ${textSizes[size]} whitespace-pre-line`}>
          {textContent}
        </span>
      </>
    )
  } else if (variant === 'square' || variant === 'circle') {
    const shapeStyles = variant === 'circle' ? 'rounded-full' : ''
    const hoverStyles = href ? 'hover:bg-coral-600 transition-colors' : ''
    variantStyles = `items-center justify-center ${buttonSizes[size]} ${shapeStyles} bg-coral-500 text-white ${hoverStyles}`
    content = <LogoSvg className={iconSizes[size]} />
  }

  // Combine all styles
  const allStyles = `${baseStyles} ${variantStyles} ${className}`

  // Render as link or div depending on href prop
  if (href) {
    return (
      <Link href={href} variant="unstyled" className={allStyles} {...props}>
        {content}
      </Link>
    )
  }

  // When rendering as div, filter out anchor-specific props
  const { target, rel, referrerPolicy, download, ping, hrefLang, type, ...divProps } = props as any

  return (
    <div className={allStyles} {...divProps}>
      {content}
    </div>
  )
}
