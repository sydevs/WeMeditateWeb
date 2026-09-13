import { describe, it, expect } from 'vitest'
import {
  buildAlternates,
  localeUrl,
  normalizeContentPath,
  advertisedLocales,
  X_DEFAULT,
} from './hreflang'
import type { Locale } from '../server/cms-types'

const ORIGIN = 'https://wemeditate.com'

describe('normalizeContentPath', () => {
  it('collapses the routing spelling of the home page back to a URL', () => {
    // +onBeforeRoute rewrites `/` to `/index` before routing, and
    // urlPathname carries that through to the render. `/index` is not a URL
    // to point a crawler at.
    expect(normalizeContentPath('/index')).toBe('/')
    expect(normalizeContentPath('/')).toBe('/')
  })

  it('drops a trailing slash, so a page is not its own duplicate', () => {
    expect(normalizeContentPath('/about/')).toBe('/about')
  })

  it('falls back to the root for a missing path', () => {
    expect(normalizeContentPath(null)).toBe('/')
    expect(normalizeContentPath(undefined)).toBe('/')
    expect(normalizeContentPath('')).toBe('/')
  })
})

describe('localeUrl', () => {
  it('serves English bare, because /en/x 301s to /x', () => {
    // Advertising /en/about would advertise a redirect, which is the one
    // thing a canonical must never be (pages/+onBeforeRoute.ts:37-41).
    expect(localeUrl(ORIGIN, 'en', '/about')).toBe('https://wemeditate.com/about')
  })

  it('prefixes every other locale', () => {
    expect(localeUrl(ORIGIN, 'fr', '/about')).toBe('https://wemeditate.com/fr/about')
  })

  it('keeps a region-cased code exactly as the CMS stores it', () => {
    expect(localeUrl(ORIGIN, 'pt-BR', '/about')).toBe('https://wemeditate.com/pt-BR/about')
  })

  it('renders the home page as a bare prefix, which the router resolves', () => {
    expect(localeUrl(ORIGIN, 'en', '/index')).toBe('https://wemeditate.com/')
    expect(localeUrl(ORIGIN, 'fr', '/index')).toBe('https://wemeditate.com/fr')
  })
})

describe('advertisedLocales', () => {
  const OFFERED: Locale[] = ['en', 'fr', 'de']

  it('advertises exactly the locales the document is published in', () => {
    const status = { en: 'published', fr: 'published', de: 'draft' }

    expect(advertisedLocales(status, OFFERED)).toEqual(['en', 'fr'])
  })

  it('never advertises a locale the document is not published in', () => {
    // THE criterion this whole ticket exists for. Payload's fallback
    // returns English text for an untranslated page, so using the site's
    // locale set here would declare translations that do not exist, and
    // Google drops a cluster whose members contradict each other.
    const status = { en: 'published' }

    expect(advertisedLocales(status, OFFERED)).toEqual(['en'])
    expect(advertisedLocales(status, OFFERED)).not.toContain('fr')
  })

  it('never advertises a locale the site does not offer', () => {
    // loadSiteContext 404s a locale outside availableLocales, so a locale
    // published in the CMS but switched off here has no URL to point at.
    const status = { en: 'published', ru: 'published' }

    expect(advertisedLocales(status, OFFERED)).toEqual(['en'])
  })

  it('follows the offered order, so the emitted rows are stable', () => {
    const status = { de: 'published', en: 'published', fr: 'published' }

    expect(advertisedLocales(status, OFFERED)).toEqual(['en', 'fr', 'de'])
  })

  it('makes no claim for a collection without per-locale publish state', () => {
    // `meditations` returns `_status` as a plain string and `lectures`
    // omits it: neither opts into versions.drafts.localizeStatus upstream,
    // so neither has a per-document translation claim to make.
    expect(advertisedLocales('published', OFFERED)).toEqual([])
    expect(advertisedLocales(undefined, OFFERED)).toEqual([])
    expect(advertisedLocales(null, OFFERED)).toEqual([])
    expect(advertisedLocales(['en'], OFFERED)).toEqual([])
  })
})

describe('buildAlternates', () => {
  it('emits one row per advertised locale, plus x-default', () => {
    const alternates = buildAlternates({
      origin: ORIGIN,
      path: '/about',
      locales: ['en', 'fr'],
    })

    expect(alternates).toEqual([
      { hreflang: 'en', href: 'https://wemeditate.com/about' },
      { hreflang: 'fr', href: 'https://wemeditate.com/fr/about' },
      { hreflang: X_DEFAULT, href: 'https://wemeditate.com/about' },
    ])
  })

  it('points x-default at the bare English URL', () => {
    const alternates = buildAlternates({ origin: ORIGIN, path: '/index', locales: ['en', 'de'] })

    expect(alternates.at(-1)).toEqual({ hreflang: X_DEFAULT, href: 'https://wemeditate.com/' })
  })

  it('omits x-default where English is not advertised', () => {
    // getPageBySlug drops a draft, so the bare URL 404s. Pointing the
    // fallback at a 404 is worse than having no fallback.
    const alternates = buildAlternates({ origin: ORIGIN, path: '/about', locales: ['fr', 'de'] })

    expect(alternates.map((a) => a.hreflang)).toEqual(['fr', 'de'])
  })

  it('emits nothing for a document that advertises no locales', () => {
    expect(buildAlternates({ origin: ORIGIN, path: '/meditations/1', locales: [] })).toEqual([])
  })

  it('renders every member of a cluster with the same cluster', () => {
    // Reciprocity: /about and /fr/about carry identical annotations, so
    // each lists itself and its sibling without knowing which it is.
    const locales: Locale[] = ['en', 'fr']
    const bare = buildAlternates({ origin: ORIGIN, path: '/about', locales })
    const prefixed = buildAlternates({ origin: ORIGIN, path: '/about', locales })

    expect(prefixed).toEqual(bare)
    expect(bare.map((a) => a.href)).toContain('https://wemeditate.com/fr/about')
  })
})
