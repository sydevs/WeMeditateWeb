import { describe, it, expect } from 'vitest'
import {
  isSafeHttpUrl,
  isSafeNavigationUrl,
  isSitePath,
  localeFromPath,
  localePath,
  localeUrl,
  normalizeContentPath,
  sitePathFromUrl,
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

describe('sitePathFromUrl', () => {
  it('returns the path under a URL this origin serves', () => {
    expect(sitePathFromUrl(`${ORIGIN}/map/gb/london`, ORIGIN)).toBe('/map/gb/london')
    expect(sitePathFromUrl(`${ORIGIN}/`, ORIGIN)).toBe('/')
  })

  it('keeps the query and fragment, which name a different document', () => {
    expect(sitePathFromUrl(`${ORIGIN}/map/gb?locale=fr#events`, ORIGIN)).toBe(
      '/map/gb?locale=fr#events',
    )
  })

  it('refuses another origin, including a port or scheme that only looks like ours', () => {
    expect(sitePathFromUrl('https://other.org/map/gb', ORIGIN)).toBeNull()
    expect(sitePathFromUrl('http://wemeditate.com/map/gb', ORIGIN)).toBeNull()
    expect(sitePathFromUrl('https://wemeditate.com:8443/map/gb', ORIGIN)).toBeNull()
  })

  it('refuses a scheme that would execute rather than navigate', () => {
    // `new URL` parses these happily, and their `origin` is `null` — which
    // compares unequal here, but the scheme gate is what says so on purpose.
    expect(sitePathFromUrl('javascript:alert(1)', ORIGIN)).toBeNull()
    expect(sitePathFromUrl('data:text/html,<script>alert(1)</script>', ORIGIN)).toBeNull()
  })

  it('refuses a same-origin path that would read as another host', () => {
    // `//evil.com` is a path by origin and a host by spelling. `Link` would
    // emit it untouched, so the absolute URL is the safer answer.
    expect(sitePathFromUrl(`${ORIGIN}//evil.com`, ORIGIN)).toBeNull()
    expect(sitePathFromUrl(`${ORIGIN}//evil.com/map/gb`, ORIGIN)).toBeNull()
  })

  it('refuses what does not parse, and a relative path, which has no origin', () => {
    expect(sitePathFromUrl('not a url', ORIGIN)).toBeNull()
    expect(sitePathFromUrl('/map/gb', ORIGIN)).toBeNull()
  })

  it('refuses everything when the origin is unknown', () => {
    // Outside a Vike app there is no request to compare against, and a
    // guessed relativization would point at a URL we cannot confirm we serve.
    expect(sitePathFromUrl(`${ORIGIN}/map/gb`, null)).toBeNull()
    expect(sitePathFromUrl(`${ORIGIN}/map/gb`, undefined)).toBeNull()
    expect(sitePathFromUrl(`${ORIGIN}/map/gb`, '')).toBeNull()
  })
})
