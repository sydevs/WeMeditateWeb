/**
 * The locale codes SahajCloud defines, and the few rules every side of the
 * site reads them by.
 */

import type { Locale } from '@/types/sahajcloud'

/**
 * Every locale SahajCloud defines, as a lookup. Derived from `Locale`, so a
 * locale added upstream becomes a compile error here until it is listed.
 *
 * This is the set of codes that may appear as a URL prefix. It is not the
 * set the site offers — that is `WebConfig.availableLocales`, which an
 * editor controls per project.
 */
export const KNOWN_LOCALES: Record<Locale, true> = {
  en: true,
  es: true,
  de: true,
  it: true,
  fr: true,
  ru: true,
  ro: true,
  cs: true,
  uk: true,
  el: true,
  hy: true,
  pl: true,
  'pt-BR': true,
  fa: true,
  bg: true,
  tr: true,
  'en-AU': true,
  hu: true,
  nl: true,
}

/** Narrows an arbitrary string to a known locale code. */
export function isLocale(value: string): value is Locale {
  return Object.prototype.hasOwnProperty.call(KNOWN_LOCALES, value)
}

/** The locale every other one falls back to. Always offered. */
export const DEFAULT_LOCALE: Locale = 'en'

/** Accepts only a locale SahajCloud defines. Anything else reads as {@link DEFAULT_LOCALE}. */
export function parseLocale(raw: string | undefined): Locale {
  return raw && isLocale(raw) ? raw : DEFAULT_LOCALE
}

/** Locales that read right-to-left. Drives `<html dir>`. */
const RTL_LOCALES: ReadonlySet<string> = new Set(['fa'])

/** Text direction for a locale, for `<html dir>`. */
export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
}
