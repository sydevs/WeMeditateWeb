import { ComponentProps } from 'react'

export interface LanguageFlagProps extends ComponentProps<'span'> {
  /**
   * Language code (ISO 639-1)
   */
  language: 'en' | 'es' | 'de' | 'it' | 'fr' | 'ru' | 'ro' | 'cs' | 'uk' | 'bg'

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
 * LanguageFlag component for displaying country/language flags.
 *
 * Shows flag emoji or icon for supported languages.
 * Optionally displays language label alongside flag.
 *
 * @example
 * <LanguageFlag language="en" />
 * <LanguageFlag language="es" size="md" showLabel />
 * <LanguageFlag language="fr" size="lg" />
 */
export function LanguageFlag({
  language,
  size = 'sm',
  showLabel = false,
  className = '',
  ...props
}: LanguageFlagProps) {
  const languageConfig = {
    en: { flag: '🇬🇧', label: 'English' },
    es: { flag: '🇪🇸', label: 'Español' },
    de: { flag: '🇩🇪', label: 'Deutsch' },
    it: { flag: '🇮🇹', label: 'Italiano' },
    fr: { flag: '🇫🇷', label: 'Français' },
    ru: { flag: '🇷🇺', label: 'Русский' },
    ro: { flag: '🇷🇴', label: 'Română' },
    cs: { flag: '🇨🇿', label: 'Čeština' },
    uk: { flag: '🇺🇦', label: 'Українська' },
    bg: { flag: '🇧🇬', label: 'Български' },
  }

  const { flag, label } = languageConfig[language]

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
