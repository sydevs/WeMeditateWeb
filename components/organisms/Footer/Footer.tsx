import { FooterLinkList, FooterLink } from '../../molecules/FooterLinkList'
import { LanguageDropdown, LanguageOption } from '../../molecules/LanguageDropdown'
import { SocialIcon } from '../../atoms/SocialIcon'
import { FloralDividerSvg } from '../../atoms/svgs'

/**
 * A footer section with title and links
 */
export interface FooterSection {
  /** Section title */
  title: string
  /** Array of links in this section */
  links: FooterLink[]
}

/**
 * A social media link
 */
export interface SocialLink {
  /** Social media platform */
  platform: 'facebook' | 'instagram' | 'bluesky' | 'youtube' | 'pinterest' | 'whatsapp' | 'linkedin' | 'yandex' | 'telegram' | 'wechat'
  /** URL to the social media profile */
  href: string
}

/**
 * Props for the Footer component
 */
export interface FooterProps {
  /** Hero links (larger, no title) for primary navigation */
  heroLinks: FooterLink[]
  /** Footer sections with titles and links */
  sections: FooterSection[]
  /** Social media links */
  socialLinks: SocialLink[]
  /** Current language code */
  currentLanguage: 'en' | 'es' | 'de' | 'it' | 'fr' | 'ru' | 'ro' | 'cs' | 'uk' | 'bg'
  /** Available language options */
  languages: LanguageOption[]
  /** Copyright text */
  copyrightText: string
  /** Current locale for locale-aware links */
  locale?: string
}


/**
 * Footer organism component with responsive grid layout.
 *
 * Features:
 * - Decorative floral divider at top
 * - 4-column grid on desktop (hero links, 2 link sections, social + language)
 * - 2x2 grid on tablet
 * - Stacked vertically on mobile
 * - Copyright bar at bottom
 *
 * @example
 * ```tsx
 * <Footer
 *   heroLinks={[
 *     { text: 'Meditate Now', href: '/meditate' },
 *     { text: 'Music for meditation', href: '/music' }
 *   ]}
 *   sections={[
 *     {
 *       title: 'Learn more',
 *       links: [
 *         { text: 'About Us', href: '/about' },
 *         { text: 'Contact', href: '/contact' }
 *       ]
 *     }
 *   ]}
 *   socialLinks={[
 *     { platform: 'instagram', href: 'https://instagram.com/wemeditate' },
 *     { platform: 'facebook', href: 'https://facebook.com/wemeditate' }
 *   ]}
 *   currentLanguage="en"
 *   languages={[...]}
 *   copyrightText="© WeMeditate, 2025"
 * />
 * ```
 */
export function Footer({
  heroLinks,
  sections,
  socialLinks,
  currentLanguage,
  languages,
  copyrightText,
  locale,
}: FooterProps) {
  return (
    <footer className="w-full bg-white">
      {/* Decorative Divider */}
      <div className="relative w-full text-center pt-[53px]" role="separator" aria-hidden="true">
        {/* The horizontal line */}
        <div className="w-full border-t border-gray-200 absolute bottom-0" />

        {/* Floral design centered over the line */}
        <div className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 bg-white px-4 text-gray-500">
          <FloralDividerSvg />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Hero Links Section */}
          <div>
            <FooterLinkList variant="hero" links={heroLinks} locale={locale} />
          </div>

          {/* Regular Link Sections */}
          {sections.map((section, index) => (
            <div key={index}>
              <FooterLinkList title={section.title} links={section.links} locale={locale} />
            </div>
          ))}

          {/* Social + Language Section */}
          <div className="flex flex-col gap-6">
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <SocialIcon
                  key={index}
                  platform={social.platform}
                  href={social.href}
                  size="lg"
                  color="brand"
                />
              ))}
            </div>

            {/* Language Dropdown */}
            <LanguageDropdown
              currentLanguage={currentLanguage}
              languages={languages}
              align="left"
            />
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-600">{copyrightText}</p>
        </div>
      </div>
    </footer>
  )
}
