import { ComponentProps } from 'react'
import { Link } from '@/components/atoms'
import { LeafSvg } from '@/components/atoms/graphics/svgs'
import type { Locale, NavPage } from '@/types/sahajcloud'
import { useT } from '@/hooks/useT'
import { documentHref } from '@/lib/urls/document-routes'

export interface DiscoverMeditationProps extends ComponentProps<'section'> {
  /**
   * The pages to offer, in the order an editor set: `wm-web-config.classPages`.
   * Each becomes one action, named by the page's own title, with its
   * `meta.description` as the line under that title; a page with none still
   * gets its action.
   */
  pages: readonly NavPage[]

  /** Current locale for link prefixing */
  locale?: Locale
}

/**
 * Full-height call-to-action section encouraging users to discover meditation.
 * Features a serene background image with one action per configured page.
 *
 * Renders nothing when no page resolves to a link: a call to action with no
 * action is a dead end.
 */
export function DiscoverMeditation({
  pages,
  locale,
  className = '',
  ...props
}: DiscoverMeditationProps) {
  const t = useT()

  const actions = pages.flatMap((page) => {
    const href = documentHref('pages', page)

    return href ? [{ page, href }] : []
  })

  if (actions.length === 0) {
    return null
  }

  return (
    <section
      className={`
        relative min-h-screen
        flex items-center justify-center
        text-center text-gray-900
        py-24 lg:pb-48
        ${className}
      `}
      {...props}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        role="presentation"
        style={{
          backgroundImage: 'url(/images/backgrounds/discover-meditation-background.webp)',
        }}
      />

      {/* Gradient Overlay - left side */}
      <div
        className="absolute inset-0 bg-linear-to-r from-transparent to-teal-100/30 w-[30%]"
        role="presentation"
      />

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header Section: the section's gray-900, not gray-700. Under `md` the
            subtitle is normal-size text on the photo, where gray-700 measured 3.8:1. */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-normal mb-8">{t('discover.general.title')}</h2>
          <p className="text-xl md:text-2xl font-light max-w-lg mx-auto">
            {t('discover.general.subtitle')}
          </p>
        </div>

        {/* Action Items */}
        <div className="flex flex-wrap gap-8 sm:gap-12 lg:gap-16 xl:gap-24 items-start justify-center mt-12 lg:mt-24">
          {actions.map(({ page, href }) => (
            <ActionItem key={page.id} href={href} locale={locale} page={page} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface ActionItemProps {
  page: NavPage
  href: string
  locale?: Locale
}

/** One configured page: a leaf, its title, and its description. */
function ActionItem({ page, href, locale }: ActionItemProps) {
  const description = page.meta?.description?.trim()

  return (
    <Link
      className="flex flex-col items-center gap-3 group"
      href={href}
      locale={locale}
      variant="neutral"
    >
      {/* The same leaf on every action. A page's `meta.image` is its share
          picture, which an editor does not pick as a glyph for this row;
          #330 gives the row a glyph of its own. */}
      <div className="w-16 h-16 group-hover:scale-105 transition-transform">
        <LeafSvg className="w-full h-full" />
      </div>
      {/* 85% white: a phone stacks the last action over the photo's dark rock,
          where 40% measured 3.1:1 and this measures 5.5:1. */}
      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg bg-white/85 backdrop-blur-xs transition-colors duration-200 group-hover:bg-white/95">
        <span className="text-lg font-medium text-gray-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {page.title}
        </span>
        {description ? (
          <span className="max-w-60 line-clamp-2 text-sm font-light text-gray-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
            {description}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
