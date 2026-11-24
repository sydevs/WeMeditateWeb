import { Dropdown } from '@/components/atoms/Dropdown'
import type { Locale } from '@/types/sahajcloud'
import { useT } from '@/hooks/useT'
import { LanguageFlag } from '@/components/atoms/graphics/LanguageFlag'
import { Link } from '@/components/atoms/Link'
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Icon } from '@/components/atoms/Icon'

/** A single language option */
export interface LanguageOption {
  /** Language code (ISO 639-1) */
  code: Locale
  /** Display label for the language */
  label: string
  /**
   * Path to navigate to, WITHOUT a locale prefix. `Link` adds the prefix
   * for the option's own `code`, so the "English is served bare" rule has
   * one owner.
   */
  href: string
}

/** Props for the LanguageDropdown component */
export interface LanguageDropdownProps {
  /** Currently selected language code */
  currentLanguage: Locale
  /** Array of available language options */
  languages: LanguageOption[]
  /** Alignment of the dropdown */
  align?: 'left' | 'right'
  /** Additional CSS classes */
  className?: string
}

/**
 * A dropdown for selecting website language.
 * Displays a globe icon with "Languages" text as trigger.
 * Dropdown contains a list of language options with flags.
 *
 * @example
 * ```tsx
 * <LanguageDropdown
 *   currentLanguage="en"
 *   languages={[
 *     { code: 'en', label: 'English', href: '/about' },
 *     { code: 'es', label: 'Español', href: '/es/about' },
 *     { code: 'de', label: 'Deutsch', href: '/de/about' }
 *   ]}
 *   align="right"
 * />
 * ```
 */
export function LanguageDropdown({
  currentLanguage,
  languages,
  align = 'left',
  className = '',
}: LanguageDropdownProps) {
  const t = useT()

  return (
    <Dropdown
      align={align}
      className={className}
      trigger={(props) => (
        <button
          className="flex touch-target items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          {...props}
        >
          <span className="text-sm font-light">{t('footer.languages')}</span>
          <Icon icon={GlobeAltIcon} size="sm" />
        </button>
      )}
    >
      <div className="flex flex-col py-2">
        {languages.map((language) => (
          <Link
            key={language.code}
            className={`px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
              language.code === currentLanguage ? 'bg-gray-50' : ''
            }`}
            href={language.href}
            locale={language.code}
          >
            <LanguageFlag language={language.code} size="sm" />
            <span className="text-sm font-light text-gray-700">{language.label}</span>
            {language.code === currentLanguage && (
              <Icon className="ml-auto text-teal-600" icon={CheckIcon} size="xs" />
            )}
          </Link>
        ))}
      </div>
    </Dropdown>
  )
}
