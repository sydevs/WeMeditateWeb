import { Dropdown } from '../../atoms/Dropdown'
import { LanguageFlag } from '../../atoms/LanguageFlag'
import { Link } from '../../Link'
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Icon } from '../../atoms/Icon'

/**
 * A single language option
 */
export interface LanguageOption {
  /** Language code (ISO 639-1) */
  code: 'en' | 'es' | 'de' | 'it' | 'fr' | 'ru' | 'ro' | 'cs' | 'uk' | 'bg'
  /** Display label for the language */
  label: string
  /** URL to navigate to when language is selected */
  href: string
}

/**
 * Props for the LanguageDropdown component
 */
export interface LanguageDropdownProps {
  /** Currently selected language code */
  currentLanguage: 'en' | 'es' | 'de' | 'it' | 'fr' | 'ru' | 'ro' | 'cs' | 'uk' | 'bg'
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
  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <span className="text-sm font-light">Languages</span>
          <Icon icon={GlobeAltIcon} size="sm" />
        </button>
      }
      align={align}
      className={className}
    >
      <div className="flex flex-col py-2">
        {languages.map((language) => (
          <Link
            key={language.code}
            href={language.href}
            className={`px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
              language.code === currentLanguage ? 'bg-gray-50' : ''
            }`}
          >
            <LanguageFlag language={language.code} size="sm" />
            <span className="text-sm font-light text-gray-700">{language.label}</span>
            {language.code === currentLanguage && (
              <Icon icon={CheckIcon} size="xs" className="ml-auto text-teal-600" />
            )}
          </Link>
        ))}
      </div>
    </Dropdown>
  )
}
