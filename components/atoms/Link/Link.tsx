import { ComponentProps } from 'react'
import { useLocale } from '../../../hooks/usePageContext'
import { useT } from '../../../hooks/useT'
import { isSafeLinkHref, localeHref } from '../../../lib/urls'
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
   * Whether the link is external: it opens in a new tab, with the security
   * attributes and the screen-reader announcement that go with one.
   *
   * It stays a prop rather than becoming auto-detection. `Link` cannot read
   * the request's origin, so off a request every absolute href would read as
   * foreign; and an editor's own `newTab` field decides for a rich-text link.
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
 * An href whose scheme is not one {@link isSafeLinkHref} allows renders with
 * no `href` at all, so a `javascript:` value configured upstream cannot run in
 * our origin. This is the gate for every SahajCloud-authored link on the site,
 * because they all converge here.
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
  'aria-label': ariaLabel,
  ...props
}: LinkProps) {
  // `useLocale` owns the fallback for Ladle and a bare unit render, where
  // there is no `pageContext` at all and an href would become `/undefined/x`.
  const pageLocale = useLocale()
  const t = useT()

  const safe = isSafeLinkHref(href)

  if (!safe && import.meta.env?.DEV) {
    console.warn(`[Link] refused an href whose scheme is not allowed: "${href}"`)
  }

  const baseStyles = 'focus-ring'

  // Surface tokens, so a link on a dark surface lightens without being told.
  //
  // Each colour carries its own `transition-colors`, so `unstyled` really is
  // unstyled: a caller painting a transform hover no longer has to leave the
  // atom to escape a `transition-property` it never asked for. A caller that
  // paints a colour hover brings the transition with it.
  const variantStyles = {
    default:
      'text-primary hover:text-primary-strong hover:underline transition-colors duration-200',
    primary: 'text-primary font-medium hover:text-primary-strong transition-colors duration-200',
    secondary:
      'text-secondary font-medium hover:text-secondary-strong transition-colors duration-200',
    neutral: 'text-fg-muted hover:text-fg transition-colors duration-200',
    unstyled: '',
  }

  const sizeStyles = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    inherit: '',
  }

  // A refused href opens nothing, so it announces nothing and opens no tab.
  const opensNewTab = external && safe
  const externalProps = opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  // An `aria-label` replaces the accessible name outright, so a child the
  // caller cannot see would never be read. `SocialShare` lost the whole
  // announcement that way (#238). Both cases read the one suffix key after
  // the link's own name: children get it as an `sr-only` sibling, and a
  // label gets it joined on here, the same order a reader hears either way.
  //
  // shortcut: only `aria-label` is detected, not every way a name can come
  // from outside the anchor — upgrade when a caller passes `aria-labelledby`
  // or `title`, which would silently lose the warning again.
  const suffix = opensNewTab ? t('common.a11y.opens_in_new_tab_suffix') : undefined
  const label = suffix && ariaLabel ? `${ariaLabel} ${suffix}` : ariaLabel

  return (
    <a
      aria-label={label}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      href={safe ? localeHref(locale ?? pageLocale, href) : undefined}
      {...externalProps}
      {...props}
    >
      {children}
      {suffix && !ariaLabel && <span className="sr-only">{suffix}</span>}
    </a>
  )
}
