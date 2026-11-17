import { ComponentProps } from 'react'
import { Link } from '../../atoms'
import { PlayCircleIcon, ComputerDesktopIcon, MapPinIcon } from '@heroicons/react/24/outline'
import type { Locale } from '../../../server/sahajcloud-types'
import { useT } from '../../../hooks/useT'

export interface DiscoverMeditationProps extends ComponentProps<'section'> {
  /** Overrides `discover.general.title`. */
  title?: string

  /** Overrides `discover.general.subtitle`. */
  subtitle?: string

  /** Current locale for link prefixing */
  locale?: Locale
}

/**
 * Full-height call-to-action section encouraging users to discover meditation.
 * Features a serene background image with three action items: recorded meditations,
 * live meditations, and in-person classes.
 */
export function DiscoverMeditation({
  title,
  subtitle,
  locale,
  className = '',
  ...props
}: DiscoverMeditationProps) {
  const t = useT()

  return (
    <section
      className={`
        relative min-h-screen
        flex items-center justify-center
        text-center text-gray-700
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

      {/* Gradient Overlay - left side, extends 65px below component */}
      <div
        className="absolute inset-0 -bottom-16 bg-linear-to-r from-transparent to-teal-100/30 w-[30%]"
        role="presentation"
      />

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-normal text-gray-700 mb-8">
            {title ?? t('discover.general.title')}
          </h2>
          <p className="text-xl md:text-2xl font-light text-gray-700 max-w-lg mx-auto">
            {subtitle ?? t('discover.general.subtitle')}
          </p>
        </div>

        {/* Action Items */}
        <div className="flex flex-wrap gap-8 sm:gap-12 lg:gap-16 xl:gap-24 items-center justify-center mt-12 lg:mt-24">
          <ActionItem
            href="/meditations"
            icon={PlayCircleIcon}
            locale={locale}
            subtitle={t('discover.general.meditate_now_subtitle')}
            title={t('discover.general.meditate_now')}
          />

          <ActionItem
            href="/live"
            icon={ComputerDesktopIcon}
            locale={locale}
            subtitle={t('discover.general.live_guidance_subtitle')}
            title={t('discover.general.live_guidance')}
          />

          <ActionItem
            href="/classes"
            icon={MapPinIcon}
            locale={locale}
            subtitle={t('discover.general.classes_near_me_subtitle')}
            title={t('discover.general.classes_near_me')}
          />
        </div>
      </div>
    </section>
  )
}

/** Individual action item with icon, title, and subtitle */
interface ActionItemProps {
  href: string
  locale?: Locale
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  subtitle: string
}

function ActionItem({ href, locale, icon: Icon, title, subtitle }: ActionItemProps) {
  return (
    <Link
      className="flex flex-col items-center gap-3 group"
      href={href}
      locale={locale}
      variant="neutral"
    >
      <div className="w-16 h-16 group-hover:scale-105 transition-transform">
        <Icon className="w-full h-full stroke-current stroke-[0.5]" />
      </div>
      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg bg-white/40 backdrop-blur-xs transition-colors duration-200 group-hover:bg-white/60">
        <span className="text-lg font-medium text-gray-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {title}
        </span>
        <span className="text-sm font-light text-gray-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {subtitle}
        </span>
      </div>
    </Link>
  )
}
