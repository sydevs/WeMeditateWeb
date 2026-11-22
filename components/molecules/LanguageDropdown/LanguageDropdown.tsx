import { Dropdown, DropdownItem } from '@/components/atoms/Dropdown'
import type { Locale } from '@/types/sahajcloud'
import { useT } from '@/hooks/useT'
import { LanguageFlag } from '@/components/atoms/graphics/LanguageFlag'
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
      <ul className="flex flex-col py-2">
        {languages.map((language) => {
          const isCurrent = language.code === currentLanguage

          return (
            <li key={language.code}>
              {/* Each option links to this page in its own language, so the
                  current one is this page. */}
              <DropdownItem
                aria-current={isCurrent ? 'page' : undefined}
                className={isCurrent ? 'bg-gray-50' : ''}
                href={language.href}
                locale={language.code}
                size="sm"
              >
                <span className="flex items-center gap-3">
                  <LanguageFlag language={language.code} size="sm" />
                  <span className="text-sm font-light text-gray-700">{language.label}</span>
                  {isCurrent && (
                    <Icon className="ml-auto text-teal-600" icon={CheckIcon} size="xs" />
                  )}
                </span>
              </DropdownItem>
            </li>
          )
        })}
      </ul>
    </Dropdown>
  )
}
