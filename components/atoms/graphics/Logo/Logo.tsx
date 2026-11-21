import { ComponentProps, HTMLAttributes } from 'react'
import { Link } from '../../Link'
import { LogoSvg } from '../svgs'
import { useT } from '../../../../hooks/useT'

export interface LogoProps extends Omit<ComponentProps<'a'>, 'href' | 'children'> {
  /** Logo variant */
  variant?: 'icon' | 'square' | 'circle' | 'text' | 'inline'
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
 * - text: Icon above the site-title wordmark (stacked vertically)
 * - inline: Icon beside the wordmark, on one line, for a bar
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
  const t = useT()

  // The wordmark is the site title in the mark's own typography, derived from
  // the one translated string rather than restated per locale: an initial
  // capital with the rest lower-case.
  const title = t('common.general.site_title')
  const wordmark = title.charAt(0) + title.slice(1).toLowerCase()

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
  const lockupLinkStyles = href ? 'no-underline hover:opacity-80 transition-opacity' : ''

  if (variant === 'icon') {
    variantStyles = href ? 'hover:opacity-80 transition-opacity' : ''
    content = <LogoSvg className={iconSizes[size]} />
  } else if (variant === 'text') {
    // Stacked: icon above the wordmark
    const alignmentStyles = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right',
    }

    // A line per word where the lockup is stacked against a left or right edge.
    const textContent = align === 'center' ? wordmark : wordmark.replace(/ /g, '\n')

    variantStyles = `flex-col gap-1 ${alignmentStyles[align]} ${lockupLinkStyles}`
    content = (
      <>
        <LogoSvg className={iconSizes[size]} />
        <span className={`font-normal ${textSizes[size]} whitespace-pre-line`}>{textContent}</span>
      </>
    )
  } else if (variant === 'inline') {
    // A bar is what this lockup is for, and a linked one there owes the 44px floor.
    variantStyles = `items-center gap-2.5 ${lockupLinkStyles} ${href ? 'touch-target' : ''}`
    content = (
      <>
        <LogoSvg className={`shrink-0 ${iconSizes[size]}`} />
        <span className={`font-normal ${textSizes[size]} whitespace-nowrap`}>{wordmark}</span>
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
  const { anchor, shared } = splitAnchorProps(props)

  // Render as link or div depending on href prop
  if (href) {
    return (
      <Link className={allStyles} href={href} variant="unstyled" {...shared} {...anchor}>
        {content}
      </Link>
    )
  }

  return (
    <div className={allStyles} {...shared}>
      {content}
    </div>
  )
}

/**
 * What only an `<a>` understands, so the unlinked mark's `<div>` never receives it.
 * `ref` is typed for an anchor, so the unlinked mark takes no ref on purpose.
 */
type AnchorOnlyProps = Pick<
  ComponentProps<'a'>,
  'download' | 'hrefLang' | 'media' | 'ping' | 'ref' | 'referrerPolicy' | 'rel' | 'target' | 'type'
>

/**
 * `shared` is typed for any element, which is what lets the `<div>` take it:
 * an anchor's own event-handler and ref types do not fit one.
 */
function splitAnchorProps({
  download,
  hrefLang,
  media,
  ping,
  ref,
  referrerPolicy,
  rel,
  target,
  type,
  ...shared
}: AnchorOnlyProps & HTMLAttributes<HTMLElement>): {
  anchor: AnchorOnlyProps
  shared: HTMLAttributes<HTMLElement>
} {
  return {
    anchor: { download, hrefLang, media, ping, ref, referrerPolicy, rel, target, type },
    shared,
  }
}
