import { describe, it, expect } from 'vitest'
import { isIndexPath, localeFromPath, localePath, localeUrl, normalizeContentPath } from './urls'

const ORIGIN = 'https://wemeditate.com'

describe('localeFromPath', () => {
  it('defaults to English with no prefix, and says the prefix was absent', () => {
    expect(localeFromPath('/about')).toEqual({
      locale: 'en',
      pathWithoutLocale: '/about',
      prefixed: false,
    })
  })

  it('maps the bare root to the routing spelling of the home page', () => {
    expect(localeFromPath('/')).toMatchObject({ locale: 'en', pathWithoutLocale: '/index' })
    expect(localeFromPath('/fr')).toMatchObject({ locale: 'fr', pathWithoutLocale: '/index' })
    expect(localeFromPath('/fr/')).toMatchObject({ locale: 'fr', pathWithoutLocale: '/index' })
  })

  it('strips a locale prefix off the path', () => {
    expect(localeFromPath('/fa/meditations/1')).toEqual({
      locale: 'fa',
      pathWithoutLocale: '/meditations/1',
      prefixed: true,
    })
  })

  it('keeps a region-cased code exactly as the CMS stores it', () => {
    expect(localeFromPath('/pt-BR/about')).toMatchObject({ locale: 'pt-BR' })
    expect(localeFromPath('/en-AU/about')).toMatchObject({ locale: 'en-AU' })
  })

  it('reports an explicit /en prefix, which the router turns into a 301', () => {
    expect(localeFromPath('/en/about')).toEqual({
      locale: 'en',
      pathWithoutLocale: '/about',
      prefixed: true,
    })
  })

  it('leaves a segment that only looks like a locale alone', () => {
    // `st` is not a CMS locale, so /status/page is a path, not a prefix.
    expect(localeFromPath('/status/page')).toMatchObject({
      locale: 'en',
      pathWithoutLocale: '/status/page',
      prefixed: false,
    })
    expect(localeFromPath('/pt-br/about')).toMatchObject({ locale: 'en', prefixed: false })
  })
})

describe('isIndexPath', () => {
  it('recognizes the routing spelling, slash or no slash', () => {
    expect(isIndexPath('/index')).toBe(true)
    expect(isIndexPath('/index/')).toBe(true)
  })

  it('rejects a real path that merely ends in index', () => {
    // +onBeforeRoute 301s what this matches, so a page really named
    // `/about/index` must not disappear behind the router's own spelling.
    expect(isIndexPath('/about/index')).toBe(false)
    expect(isIndexPath('/indexes')).toBe(false)
    expect(isIndexPath('/')).toBe(false)
  })
})

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

describe('localePath', () => {
  it('serves English bare, and prefixes every other locale', () => {
    expect(localePath('en', '/about')).toBe('/about')
    expect(localePath('fr', '/about')).toBe('/fr/about')
  })

  it('spells a locale home page as the bare prefix', () => {
    // +onBeforeRoute redirects a requested /index here, so /fr/ would be a
    // redirect to a redirect.
    expect(localePath('en', '/')).toBe('/')
    expect(localePath('fr', '/')).toBe('/fr')
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
    expect(localeUrl(ORIGIN, 'en', '/')).toBe('https://wemeditate.com/')
    expect(localeUrl(ORIGIN, 'fr', '/')).toBe('https://wemeditate.com/fr')
  })
})
