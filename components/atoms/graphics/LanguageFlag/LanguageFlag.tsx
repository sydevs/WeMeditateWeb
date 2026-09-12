import { ComponentProps } from 'react'
import type { Locale } from '../../../../server/cms-types'
import { localeEndonym } from '../../../../lib/locale-names'

export interface LanguageFlagProps extends ComponentProps<'span'> {
  /**
   * Locale code, exactly as the CMS stores it (`en`, `pt-BR`, `en-AU`).
   */
  language: Locale

  /**
   * Flag size
   * @default 'sm'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'

  /**
   * Show language label
   * @default false
   */
  showLabel?: boolean
}

/**
 * The flag shown for each locale the CMS offers.
 *
 * A flag stands for a language here, not a country, so the mapping is a
 * deliberate editorial choice rather than a derivation from the region
 * subtag: `en` flies the Union Jack, `en-AU` the Australian flag, `hy`
 * Armenia's. Every locale in `KNOWN_LOCALES` needs an entry — the
 * `Record<Locale, string>` type makes a new upstream locale a compile
 * error here.
 */
const FLAG_BY_LOCALE: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
  fr: '🇫🇷',
  ru: '🇷🇺',
  ro: '🇷🇴',
  cs: '🇨🇿',
  uk: '🇺🇦',
  el: '🇬🇷',
  hy: '🇦🇲',
  pl: '🇵🇱',
  'pt-BR': '🇧🇷',
  fa: '🇮🇷',
  bg: '🇧🇬',
  tr: '🇹🇷',
  'en-AU': '🇦🇺',
  hu: '🇭🇺',
  nl: '🇳🇱',
}

/**
 * LanguageFlag component for displaying country/language flags.
 *
 * The label is the language's endonym — its name in itself — from
 * `Intl.DisplayNames`, so it is never a translated string and never needs
 * a CMS key.
 *
 * @example
 * <LanguageFlag language="en" />
 * <LanguageFlag language="es" size="md" showLabel />
 * <LanguageFlag language="pt-BR" size="lg" />
 */
export function LanguageFlag({
  language,
  size = 'sm',
  showLabel = false,
  className = '',
  ...props
}: LanguageFlagProps) {
  const flag = FLAG_BY_LOCALE[language]
  const label = localeEndonym(language)

  const sizeStyles = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span role="img" aria-label={label}>
        {flag}
      </span>
      {showLabel && <span className="font-sans text-sm">{label}</span>}
    </span>
  )
}
