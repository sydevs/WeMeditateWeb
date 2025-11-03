import { ComponentProps } from 'react'
import { Link } from '../../atoms'
import { PlayCircleIcon, ComputerDesktopIcon, UserGroupIcon, MapPinIcon } from '@heroicons/react/24/outline'

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
  title = "Discover it for yourself!",
  subtitle = "Don't just take our word for it. Try meditating and see how you feel!",
  locale,
  className = '',
  ...props
}: DiscoverMeditationProps) {
  return (
    <section
      className={`
        relative h-screen min-h-screen
        flex items-center justify-center
        text-center text-gray-700
        pb-48
        ${className}
      `}
      {...props}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/discover-meditation-background.webp)',
        }}
        role="presentation"
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
            {title}
          </h2>
          <p className="text-xl md:text-2xl font-light text-gray-700 max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Action Items */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-24 items-center justify-center mt-24">
          <ActionItem
            href="/meditations"
            locale={locale}
            icon={PlayCircleIcon}
            title="Meditate Now"
            subtitle="Watch guided meditations"
          />

          <ActionItem
            href="/live"
            locale={locale}
            icon={ComputerDesktopIcon}
            title="Live Guidance"
            subtitle="Free online meditations"
          />

          <ActionItem
            href="/classes"
            locale={locale}
            icon={MapPinIcon}
            title="Classes Near Me"
            subtitle="Free in-person classes"
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
      href={href}
      locale={locale}
      variant="neutral"
      className="flex flex-col items-center gap-3 group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 group-hover:scale-105 transition-transform">
        <Icon className="w-full h-full stroke-current stroke-[0.5]" />
      </div>
      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg bg-white/40 backdrop-blur-xs lg:bg-transparent lg:backdrop-blur-none">
        <span className="text-lg md:text-xl lg:text-2xl font-medium text-gray-900 lg:text-gray-700 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {title}
        </span>
        <span className="text-sm md:text-base lg:text-lg font-light text-gray-900 lg:text-gray-700 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          {subtitle}
        </span>
      </div>
    </Link>
  )
}

