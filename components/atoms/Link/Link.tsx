import { ComponentProps } from 'react'
import { useLocale } from '../../../hooks/usePageContext'
import { localeHref } from '../../../lib/urls'
import type { Locale } from '../../../server/sahajcloud-types'

export interface LinkProps extends Omit<ComponentProps<'a'>, 'href'> {
  /** Link destination (will be locale-prefixed automatically) */
  href: string

  /** Locale for the link (defaults to current page locale) */
  locale?: Locale

  /**
   * Visual style variant
   * - default: Teal with underline on hover (standard link)
   * - primary: Teal, medium weight, no underline
   * - secondary: Coral, medium weight
   * - neutral: Gray tones
   * - unstyled: No styling (useful for custom styling)
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'neutral' | 'unstyled'


  /**
   * Size variant (affects font size)
   * - sm: Small text (text-sm)
   * - base: Base text size (text-base)
   * - lg: Large text (text-lg)
   * - inherit: Inherits parent font size (no text-* class)
   * @default 'inherit'
   */
  size?: 'sm' | 'base' | 'lg' | 'inherit'

  /**
   * Whether the link is external (opens in new tab with security attributes)
   * @default false
   */
  external?: boolean
}

/**
 * Link renders with automatic locale prefixing.
 *
 * It handles internal navigation with locale awareness. The English locale
 * (en) omits the prefix. Other locales add a prefix, for example /es/path.
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
  size = 'inherit',
  external = false,
  className = '',
  children,
  ...props
}: LinkProps) {
  // `useLocale` owns the fallback for Ladle and a bare unit render, where
  // there is no `pageContext` at all and an href would become `/undefined/x`.
  const pageLocale = useLocale()

  const finalHref = localeHref(locale ?? pageLocale, href)

  const baseStyles = 'transition-colors duration-200 focus-ring'

  // Surface tokens, so a link on a dark surface lightens without being told.
  const variantStyles = {
    default: 'text-primary hover:text-primary-strong hover:underline',
    primary: 'text-primary font-medium hover:text-primary-strong',
    secondary: 'text-secondary font-medium hover:text-secondary-strong',
    neutral: 'text-fg-muted hover:text-fg',
    unstyled: '',
  }

  const sizeStyles = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    inherit: '',
  }

  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <a
      href={finalHref}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...externalProps}
      {...props}
    >
      {children}
    </a>
  )
}
