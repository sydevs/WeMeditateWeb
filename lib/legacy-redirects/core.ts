/**
 * The lookup rules, over a map passed in. The generator runs the same rules
 * over the map it just built; `lookup.ts` binds them to the committed one.
 */

import type { Locale } from '@/types/sahajcloud'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { isSitePath, localePath } from '@/lib/urls/urls'

/** What a record kind's old URL looks like, and so which table holds its slugs. */
export type ExactType =
  'article' | 'category' | 'meditation' | 'treatment' | 'subtle' | 'stream' | 'promo' | 'event'

export interface LegacyRedirectMap {
  /** New-site pages by SahajCloud id: `[slug, launch locales other than en that publish it]`. */
  pages: Record<string, [slug: string, locales: string]>
  /** A section or fixed-page key to the id of the page it lands on. */
  roles: Record<string, number>
  /** Per old locale, the translated path words that differ from English. */
  words: Record<string, Record<string, string>>
  /**
   * Per record kind and old locale, the slugs the old site answered or
   * 301ed. The value is a page id, a meditation id for `meditation`, or -1
   * when no new page matches and the kind's section takes it.
   */
  exact: Record<ExactType, Record<string, Record<string, number>>>
}

/** Old locale code, as the old site spelled it in a URL, to the new site's. */
export const LAUNCH_LOCALES: Readonly<Record<string, Locale>> = {
  en: 'en',
  ru: 'ru',
  it: 'it',
  es: 'es',
  fr: 'fr',
  de: 'de',
  'pt-br': 'pt-BR',
  cs: 'cs',
  uk: 'uk',
  bg: 'bg',
}

/** Every locale the old site could prefix a path with. */
export const OLD_LOCALES: ReadonlySet<string> = new Set([
  ...Object.keys(LAUNCH_LOCALES),
  'nl',
  'hy',
  'hi',
  'tr',
  'ro',
  'sv',
  'pl',
  'fa',
  'el',
  'ko',
  'en-au',
])

/** The section that takes a record kind with no matching page. */
export const SECTION_OF: Readonly<Record<ExactType, string>> = {
  article: 'articles',
  category: 'inspiration',
  meditation: 'meditations',
  treatment: 'techniques',
  subtle: 'subtle_system',
  stream: 'streams',
  promo: 'home',
  event: 'articles',
}

/** Words that name a section or fixed page as a whole path's first segment. */
export const ROLE_WORDS: ReadonlySet<string> = new Set([
  'home',
  'articles',
  'inspiration',
  'meditations',
  'techniques',
  'subtle_system',
  'music',
  'streams',
  'about',
  'contact',
  'shri_mataji',
  'sahaja_yoga',
  'privacy',
  'classes',
])

/** Words under `/meditations` that name a fixed route, not a meditation. */
export const MEDITATION_ROUTE_WORDS: ReadonlySet<string> = new Set([
  'archive',
  'self_realization',
  'random',
])

const MAX_SEGMENTS = 12

/**
 * One spelling for a path segment on both sides of the lookup: NFC, lower
 * case, no edge whitespace, inner whitespace as a dash. Slugs such as
 * `Divine_Mother` were case-sensitive on the old site, and two that differ
 * only in case are reported by the generator rather than kept apart.
 */
export function foldSegment(segment: string): string {
  return segment.normalize('NFC').toLowerCase().trim().replace(/\s+/g, '-')
}

function own<T>(table: Record<string, T> | undefined, key: string): T | undefined {
  return table && Object.hasOwn(table, key) ? table[key] : undefined
}

/** The folded, decoded segments of a path, or `null` when it is not a path. */
function segmentsOf(pathname: string): string[] | null {
  if (!pathname.startsWith('/')) return null

  const parts = pathname.split('/').slice(1)

  while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()
  if (parts.length > MAX_SEGMENTS) return null

  const folded: string[] = []

  for (const part of parts) {
    if (part === '') return null

    let decoded: string

    try {
      decoded = decodeURIComponent(part)
    } catch {
      return null
    }

    if (decoded.includes('/') || decoded.includes('\0')) return null
    folded.push(foldSegment(decoded))
  }

  return folded
}

/** The path a new-site page is served at for a visitor in `locale`. */
function pageHref(map: LegacyRedirectMap, id: number, locale: Locale): string {
  const [slug, locales] = map.pages[String(id)]
  const publishedThere = locale !== DEFAULT_LOCALE && locales.split(' ').includes(locale)

  return localePath(publishedThere ? locale : DEFAULT_LOCALE, slug === '' ? '/' : `/${slug}`)
}

function roleHref(map: LegacyRedirectMap, role: string, locale: Locale): string | null {
  const id = own(map.roles, role)

  return id === undefined ? null : pageHref(map, id, locale)
}

/** The role or route word a segment names in an old locale, if any. */
function wordOf(map: LegacyRedirectMap, locale: string, segment: string): string | null {
  return own(map.words[locale], segment) ?? own(map.words.en, segment) ?? null
}

function exactHref(
  map: LegacyRedirectMap,
  type: ExactType,
  locale: string,
  slug: string,
  visitor: Locale,
): string | null {
  const value = own(own(map.exact[type], locale), slug)

  if (value === undefined) return null
  if (type === 'meditation' && value > 0) return `/meditations/${value}`
  if (type !== 'meditation' && value >= 0) return pageHref(map, value, visitor)

  return roleHref(map, SECTION_OF[type], visitor)
}

function resolve(
  map: LegacyRedirectMap,
  locale: string,
  rest: string[],
  visitor: Locale,
): string | null {
  if (rest.length === 0) return roleHref(map, 'home', visitor)

  const [first, second] = rest

  if (first === 'map') return '/map'

  const word = wordOf(map, locale, first)

  if (rest.length === 1) {
    if (first === 'sitemap.xml.gz') return '/sitemap.xml'
    if (first === 'surrey' && locale === 'en') return roleHref(map, 'streams', visitor)
    if (word && ROLE_WORDS.has(word)) return roleHref(map, word, visitor)

    return (
      exactHref(map, 'promo', locale, first, visitor) ??
      exactHref(map, 'event', locale, first, visitor)
    )
  }

  if (!word) return null

  if (rest.length === 3) {
    return word === 'articles' && second === 'category'
      ? exactHref(map, 'category', locale, rest[2], visitor)
      : null
  }

  if (rest.length !== 2) return null

  switch (word) {
    case 'articles':
      return exactHref(map, 'article', locale, second, visitor)
    case 'inspiration':
      return exactHref(map, 'category', locale, second, visitor)
    case 'techniques':
      return exactHref(map, 'treatment', locale, second, visitor)
    case 'subtle_system':
      return exactHref(map, 'subtle', locale, second, visitor)
    case 'streams':
      return exactHref(map, 'stream', locale, second, visitor)
    case 'meditations': {
      const route = wordOf(map, locale, second)

      if (route && MEDITATION_ROUTE_WORDS.has(route)) return roleHref(map, 'meditations', visitor)

      return exactHref(map, 'meditation', locale, second, visitor)
    }
    default:
      return null
  }
}

/** The lookup over an explicit map, which is how the generator checks its own output. */
export function lookupIn(map: LegacyRedirectMap, pathname: string): string | null {
  const segments = segmentsOf(pathname)

  if (!segments || segments.length === 0) return null

  const prefixed = OLD_LOCALES.has(segments[0])
  const locale = prefixed ? segments[0] : 'en'
  const visitor = own(LAUNCH_LOCALES, locale) ?? DEFAULT_LOCALE
  const target = resolve(map, locale, prefixed ? segments.slice(1) : segments, visitor)

  if (target === null) return null

  // `/en` and `/en/x` 301 to `/` and `/x` on the new site before any 404, but
  // a caller that consults this first still gets one hop.
  const request = pathname.replace(/\/+$/, '') || '/'

  if (target === request) return null

  // ⚠ A target is spelled from a SahajCloud page slug, which this site did not
  // author, and the caller puts the answer in a `Location` header. `isSitePath`
  // is what stops a slug spelled `/evil.com` leaving our origin as
  // `//evil.com`.
  return isSitePath(target) ? target : null
}
