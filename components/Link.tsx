import { ComponentProps } from 'react'
import { usePageContext } from 'vike-react/usePageContext'

export interface LinkProps extends Omit<ComponentProps<'a'>, 'href'> {
  /**
   * Link destination (will be locale-prefixed automatically)
   */
  href: string

  /**
   * Locale for the link (defaults to current page locale)
   */
  locale?: string

  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'unstyled'

  /**
   * Whether the link is external (opens in new tab)
   * @default false
   */
  external?: boolean
}

/**
 * Link component with automatic locale prefixing.
 *
 * Handles internal navigation with locale awareness.
 * English locale (en) omits prefix, other locales add prefix (e.g., /es/path).
 *
 * @example
 * <Link href="/meditations">Meditations</Link>
 * <Link href="/about" locale="es">Sobre nosotros</Link>
 * <Link href="/contact" variant="primary">Contact us</Link>
 * <Link href="https://example.com" external>External site</Link>
 */
export function Link({
  href,
  locale,
  variant = 'default',
  external = false,
  className = '',
  children,
  ...props
}: LinkProps) {
  // Safely access pageContext - it may not exist in isolated environments like Ladle
  let pageContext
  try {
    pageContext = usePageContext()
  } catch (e) {
    // PageContext not available (e.g., in Ladle/Storybook)
    pageContext = null
  }

  locale = (locale ?? pageContext?.locale) || 'en'

  // Add locale prefix for non-English locales
  // Skip for external URLs (http/https) and anchor links (#)
  let finalHref = href
  if (locale !== 'en' && !href.startsWith('http') && !href.startsWith('#')) {
    finalHref = '/' + locale + href
  }

  const baseStyles = 'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles = {
    default: 'text-teal-600 hover:text-teal-700 hover:underline focus:ring-teal-500',
    primary: 'text-teal-600 font-medium hover:text-teal-700 focus:ring-teal-500',
    secondary: 'text-gray-700 hover:text-gray-900 focus:ring-gray-400',
    unstyled: '',
  }

  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <a
      href={finalHref}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...externalProps}
      {...props}
    >
      {children}
      {external && (
        <span className="sr-only"> (opens in new tab)</span>
      )}
    </a>
  )
}

