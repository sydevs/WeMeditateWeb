import { Link } from '../../atoms'

/**
 * A single link item
 */
export interface FooterLink {
  /** Link text */
  text: string
  /** Link URL */
  href: string
}

/**
 * Props for the FooterLinkList component
 */
export interface FooterLinkListProps {
  /** Optional title for the link section */
  title?: string
  /** Array of links to display */
  links: FooterLink[]
  /** Visual variant of the link list */
  variant?: 'default' | 'hero'
  /** Current locale for locale-aware links */
  locale?: string
}

/**
 * A list of footer links with optional title.
 * Supports two variants:
 * - `default`: Smaller links with a title (e.g., "Learn more" section)
 * - `hero`: Larger links without a title (e.g., "Meditate Now" section)
 *
 * @example
 * ```tsx
 * // Default variant with title
 * <FooterLinkList
 *   title="Learn more"
 *   links={[
 *     { text: 'About Us', href: '/about' },
 *     { text: 'Contact', href: '/contact' }
 *   ]}
 * />
 *
 * // Hero variant (no title, larger links)
 * <FooterLinkList
 *   variant="hero"
 *   links={[
 *     { text: 'Meditate Now', href: '/meditate' },
 *     { text: 'Music for meditation', href: '/music' }
 *   ]}
 * />
 * ```
 */
export function FooterLinkList({ title, links, variant = 'default', locale }: FooterLinkListProps) {
  const isHero = variant === 'hero'

  return (
    <div className="flex flex-col gap-3">
      {/* Title (only for default variant) */}
      {title && !isHero && (
        <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      )}

      {/* Links */}
      <nav className="flex flex-col gap-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            locale={locale}
            variant="neutral"
            size={isHero ? 'lg' : 'sm'}
            className={`hover:text-teal-600 ${
              isHero ? 'font-normal' : 'font-light'
            }`}
          >
            {link.text}
          </Link>
        ))}
      </nav>
    </div>
  )
}
