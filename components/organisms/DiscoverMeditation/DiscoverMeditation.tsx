import { ComponentProps } from 'react'
import { Link } from '../../atoms'
import { PlayCircleIcon, ComputerDesktopIcon, MapPinIcon } from '@heroicons/react/24/outline'

export interface DiscoverMeditationProps extends ComponentProps<'section'> {
  /**
   * Main heading text
   * @default "Discover it for yourself!"
   */
  title?: string

  /**
   * Subtitle/description text
   * @default "Don't just take our word for it. Try meditating and see how you feel!"
   */
  subtitle?: string

  /**
   * Current locale for link prefixing
   */
  locale?: string
}

/**
 * Full-height call-to-action section encouraging users to discover meditation.
 * Features a serene background image with three action items: recorded meditations,
 * live meditations, and in-person classes.
 */
export function DiscoverMeditation({
  title = 'Discover it for yourself!',
  subtitle = "Don't just take our word for it. Try meditating and see how you feel!",
  locale,
  className = '',
  ...props
}: DiscoverMeditationProps) {
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
          <h2 className="text-3xl md:text-4xl font-normal text-gray-700 mb-8">{title}</h2>
          <p className="text-xl md:text-2xl font-light text-gray-700 max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Action Items */}
        <div className="flex flex-wrap gap-8 sm:gap-12 lg:gap-16 xl:gap-24 items-center justify-center mt-12 lg:mt-24">
          <ActionItem
            href="/meditations"
            icon={PlayCircleIcon}
            locale={locale}
            subtitle="Watch guided meditations"
            title="Meditate Now"
          />

          <ActionItem
            href="/live"
            icon={ComputerDesktopIcon}
            locale={locale}
            subtitle="Free online meditations"
            title="Live Guidance"
          />

          <ActionItem
            href="/classes"
            icon={MapPinIcon}
            locale={locale}
            subtitle="Free in-person classes"
            title="Classes Near Me"
          />
        </div>
      </div>
    </section>
  )
}

/**
 * Individual action item with icon, title, and subtitle
 */
interface ActionItemProps {
  href: string
  locale?: string
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
      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg bg-white/40 backdrop-blur-xs">
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
