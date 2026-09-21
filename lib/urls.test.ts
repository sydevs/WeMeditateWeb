import { describe, it, expect } from 'vitest'
import {
  isSafeHttpUrl,
  isSafeNavigationUrl,
  isSitePath,
  localeFromPath,
  localePath,
  localeUrl,
  normalizeContentPath,
  sitePath,
} from './urls'

const ORIGIN = 'https://wemeditate.com'

describe('localeFromPath', () => {
  it('defaults to English with no prefix, and says the prefix was absent', () => {
    expect(localeFromPath('/about')).toEqual({
      locale: 'en',
      pathWithoutLocale: '/about',
      prefixed: false,
      requestedIndex: false,
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
      requestedIndex: false,
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
      requestedIndex: false,
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

  it('tells a requested /index from the spelling it invents for a bare root', () => {
    // +onBeforeRoute 301s the first and routes the second, and both arrive
    // here as pathWithoutLocale `/index`.
    expect(localeFromPath('/index')).toMatchObject({ requestedIndex: true })
    expect(localeFromPath('/index/')).toMatchObject({ requestedIndex: true })
    expect(localeFromPath('/fr/index')).toMatchObject({ requestedIndex: true })
    expect(localeFromPath('/')).toMatchObject({ requestedIndex: false })
    expect(localeFromPath('/fr')).toMatchObject({ requestedIndex: false })
    expect(localeFromPath('/fr/')).toMatchObject({ requestedIndex: false })
  })

  it('leaves a deeper path that merely ends in index alone', () => {
    expect(localeFromPath('/about/index')).toMatchObject({ requestedIndex: false })
    expect(localeFromPath('/indexes')).toMatchObject({ requestedIndex: false })
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
    // Not `/index`: stripping the slash first would leave the spelling the
    // router uses, which +onBeforeRoute redirects away from.
    expect(normalizeContentPath('/index/')).toBe('/')
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
    expect(localeUrl(ORIGIN, 'en', '/')).toBe('https://wemeditate.com/')
    expect(localeUrl(ORIGIN, 'fr', '/')).toBe('https://wemeditate.com/fr')
  })
})

describe('localePath', () => {
  it('serves English bare, because /en/x 301s to /x', () => {
    expect(localePath('en', '/about')).toBe('/about')
    expect(localePath('en', '/')).toBe('/')
  })

  it('prefixes every other locale', () => {
    expect(localePath('fr', '/about')).toBe('/fr/about')
    expect(localePath('pt-BR', '/about')).toBe('/pt-BR/about')
  })

  it('spells the home page /fr, not /fr/', () => {
    // `+onBeforeRoute`'s pattern matches the bare prefix and resolves it to
    // the home page, so the trailing slash buys nothing and spells the same
    // page a second way.
    expect(localePath('fr', '/')).toBe('/fr')
  })

  it('does not normalize what it is handed, which is why sitePath exists', () => {
    expect(localePath('fr', '/about/')).toBe('/fr/about/')
  })
})

const NOT_SITE_PATHS = [
  'mailto:hello@example.com',
  'tel:+1234567890',
  '#section',
  '//cdn.example.com/x',
  'https://example.com',
  'about',
]

describe('sitePath', () => {
  it('drops a trailing slash, so a link agrees with the page canonical', () => {
    // `/about/` and `/about` are one page, and ContentHead emits `/fr/about`.
    expect(sitePath('fr', '/about/')).toBe('/fr/about')
    expect(sitePath('en', '/about/')).toBe('/about')
    expect(sitePath('pt-BR', '/about/')).toBe('/pt-BR/about')
  })

  it('leaves an already-normalized path as localePath alone would', () => {
    expect(sitePath('fr', '/about')).toBe('/fr/about')
    expect(sitePath('fr', '/')).toBe('/fr')
  })

  it('collapses the routing spelling of the home page', () => {
    // Nothing hands `/index` to a link today, but it is never a URL.
    expect(sitePath('fr', '/index')).toBe('/fr')
    expect(sitePath('en', '/index')).toBe('/')
  })

  it('passes through anything that is not a path on this site', () => {
    for (const href of NOT_SITE_PATHS) {
      expect(sitePath('fr', href)).toBe(href)
    }
  })

  it('leaves an empty href empty, rather than linking to the home page', () => {
    // The guard classifies the href as written. Normalizing first would make
    // `''` into `/`, and an unset ctaHref into a home-page link.
    expect(sitePath('fr', '')).toBe('')
  })

  it('does not reach a trailing slash before a query or a hash', () => {
    // A known limit, recorded rather than fixed with a URL parser:
    // sydevs/WeMeditateWeb#119.
    expect(sitePath('fr', '/about/#section')).toBe('/fr/about/#section')
    expect(sitePath('fr', '/about/?utm=1')).toBe('/fr/about/?utm=1')
  })

  it('never edits a slash that is content inside a query or a fragment', () => {
    // `normalizeContentPath` strips a final slash off the whole string, so
    // running it on an href with a query would rewrite the query's value.
    expect(sitePath('fr', '/share?url=https://example.com/')).toBe(
      '/fr/share?url=https://example.com/',
    )
    expect(sitePath('fr', '/search?q=a/b/')).toBe('/fr/search?q=a/b/')
    expect(sitePath('fr', '/about#heading/')).toBe('/fr/about#heading/')
  })
})

describe('isSitePath', () => {
  it('accepts a path on this site', () => {
    expect(isSitePath('/about')).toBe(true)
    expect(isSitePath('/')).toBe(true)
  })

  it('rejects another origin, even one written protocol-relative', () => {
    // `//cdn.example.com` leads with a slash but is not our path, and a
    // locale glued onto any of these makes nonsense.
    expect(isSitePath('//cdn.example.com/x')).toBe(false)
    expect(isSitePath('https://example.com')).toBe(false)
  })

  it('rejects what is not a path at all', () => {
    expect(isSitePath('#section')).toBe(false)
    expect(isSitePath('mailto:hello@example.com')).toBe(false)
    expect(isSitePath('tel:+1234567890')).toBe(false)
    expect(isSitePath('about')).toBe(false)
  })
})

describe('isSafeHttpUrl', () => {
  it('accepts an http(s) URL', () => {
    expect(isSafeHttpUrl('https://status.example.com')).toBe(true)
    expect(isSafeHttpUrl('http://status.example.com')).toBe(true)
  })

  it('refuses every other scheme', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false)
  })

  it('refuses what does not parse', () => {
    expect(isSafeHttpUrl('not a url')).toBe(false)
    expect(isSafeHttpUrl('')).toBe(false)
  })
})

describe('isSafeNavigationUrl', () => {
  it('accepts a root-relative path and an http(s) URL', () => {
    expect(isSafeNavigationUrl('/thank-you')).toBe(true)
    expect(isSafeNavigationUrl('https://wemeditate.com/thanks')).toBe(true)
    expect(isSafeNavigationUrl('http://wemeditate.com/thanks')).toBe(true)
  })

  it('refuses a scheme that would execute rather than navigate', () => {
    expect(isSafeNavigationUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeNavigationUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('accepts an off-site URL, however it is spelled', () => {
    // An editor may send a visitor elsewhere, so `//host` and the `/\host`
    // browsers fold into it are the plain absolute URL by another name.
    expect(isSafeNavigationUrl('//other.example/thanks')).toBe(true)
    expect(isSafeNavigationUrl('/\\other.example/thanks')).toBe(true)
  })

  it('refuses anything that is neither', () => {
    expect(isSafeNavigationUrl('not a url')).toBe(false)
    expect(isSafeNavigationUrl('')).toBe(false)
  })
})
