import { Heading, Link } from '@/components/atoms'
import { useT } from '@/hooks/useT'
import type { Locale } from '@/types/sahajcloud'

/** A single link item */
export interface FooterLink {
  /** Link text */
  text: string
  /** Link URL */
  href: string
}

/** Props for the FooterLinkList component */
export interface FooterLinkListProps {
  /** Optional title for the link section */
  title?: string
  /** Array of links to display */
  links: FooterLink[]
  /** Visual variant of the link list */
  variant?: 'default' | 'hero'
  /** Current locale for locale-aware links */
  locale?: Locale
}

/**
 * A list of footer links with optional title.
 * Supports two variants:
 * - `default`: smaller links with a title, for example a "Learn more" section
 * - `hero`: larger links without a title, for example a "Meditate Now" section
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
  const t = useT()
  const isHero = variant === 'hero'

  return (
    <div className="flex flex-col gap-3">
      {/* Title (only for default variant) */}
      {title && !isHero && (
        <Heading className="text-base font-semibold text-gray-700 mb-1" level="h3" styleAs="none">
          {title}
        </Heading>
      )}

      {/* Links */}
      {/* A titled column is named by the heading it already shows. The hero
          column shows none, so it takes the one key for it. */}
      <nav
        aria-label={title && !isHero ? title : t('common.a11y.footer_navigation')}
        className="flex flex-col gap-3"
      >
        {links.map((link, index) => (
          <Link
            // eslint-disable-next-line @eslint-react/no-array-index-key -- a row of this list holds no state, so reusing one across an editor's reorder costs a prop diff and nothing else
            key={index}
            className={`hover:text-teal-600 ${isHero ? 'font-normal' : 'font-light'}`}
            href={link.href}
            locale={locale}
            size={isHero ? 'lg' : 'sm'}
            variant="neutral"
          >
            {link.text}
          </Link>
        ))}
      </nav>
    </div>
  )
}
