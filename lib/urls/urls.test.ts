import { describe, it, expect } from 'vitest'
import {
  absoluteHref,
  encodeUrl,
  isSafeHttpUrl,
  isSafeLinkHref,
  isSafeNavigationUrl,
  isSitePath,
  localeFromPath,
  localePath,
  localeUrl,
  normalizeContentPath,
  localeHref,
  classMapSearchHref,
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

  it('keeps a region-cased code exactly as SahajCloud stores it', () => {
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
    // `st` is not a SahajCloud locale, so /status/page is a path, not a prefix.
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

  it('keeps a region-cased code exactly as SahajCloud stores it', () => {
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

  it('does not normalize what it is handed, which is why localeHref exists', () => {
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

describe('localeHref', () => {
  it('drops a trailing slash, so a link agrees with the page canonical', () => {
    // `/about/` and `/about` are one page, and the cluster emits `/fr/about`.
    expect(localeHref('fr', '/about/')).toBe('/fr/about')
    expect(localeHref('en', '/about/')).toBe('/about')
    expect(localeHref('pt-BR', '/about/')).toBe('/pt-BR/about')
  })

  it('leaves an already-normalized path as localePath alone would', () => {
    expect(localeHref('fr', '/about')).toBe('/fr/about')
    expect(localeHref('fr', '/')).toBe('/fr')
  })

  it('collapses the routing spelling of the home page', () => {
    // Nothing hands `/index` to a link today, but it is never a URL.
    expect(localeHref('fr', '/index')).toBe('/fr')
    expect(localeHref('en', '/index')).toBe('/')
  })

  it('passes through anything that is not a path on this site', () => {
    for (const href of NOT_SITE_PATHS) {
      expect(localeHref('fr', href)).toBe(href)
    }
  })

  it('leaves an empty href empty, rather than linking to the home page', () => {
    // The guard classifies the href as written. Normalizing first would make
    // `''` into `/`, and an unset ctaHref into a home-page link.
    expect(localeHref('fr', '')).toBe('')
  })

  it('normalizes the path ahead of a query or a fragment', () => {
    expect(localeHref('fr', '/about/#section')).toBe('/fr/about#section')
    expect(localeHref('fr', '/about/?utm=1')).toBe('/fr/about?utm=1')
    expect(localeHref('en', '/about/#section')).toBe('/about#section')
  })

  it('never edits a slash that is content inside a query or a fragment', () => {
    // `normalizeContentPath` strips a final slash off whatever it is handed,
    // so handing it a whole href would rewrite the query's own value.
    expect(localeHref('fr', '/share?url=https://example.com/')).toBe(
      '/fr/share?url=https://example.com/',
    )
    expect(localeHref('fr', '/search?q=a/b/')).toBe('/fr/search?q=a/b/')
    expect(localeHref('fr', '/about#heading/')).toBe('/fr/about#heading/')
  })

  it('keeps the routing-internal /index out of an href that carries a query', () => {
    expect(localeHref('fr', '/index?x=1')).toBe('/fr?x=1')
    expect(localeHref('fr', '/?utm=1')).toBe('/fr?utm=1')
    expect(localeHref('en', '/index#top')).toBe('/#top')
  })
})

describe('classMapSearchHref', () => {
  const london = { name: 'London', coordinates: { lat: 51.5072, lng: -0.1276 } }

  /** The atlas route the widget reads back out of `?atlas=`. */
  const atlasRoute = (href: string) => new URL(href, ORIGIN).searchParams.get('atlas')

  it('spells the query-routing search the widget pre-fills, longitude first', () => {
    // The exact URL that opened the widget's search on "London" on the
    // deployed preview.
    expect(classMapSearchHref('en', london)).toBe(
      '/map?atlas=%2Fsearch%3Fcenter%3D-0.1276%2C51.5072%26q%3DLondon',
    )
  })

  it('serves the map in the visitor’s language', () => {
    expect(classMapSearchHref('fr', london)).toMatch(/^\/fr\/map\?atlas=/)
  })

  it('keeps a place name carrying & or # one value inside the route', () => {
    const route = atlasRoute(
      classMapSearchHref('en', {
        name: 'Paris & Île-de-France #1',
        coordinates: { lat: 48.8566, lng: 2.3522 },
      }),
    )
    const search = new URLSearchParams(route!.slice(route!.indexOf('?')))

    expect(route!.startsWith('/search?')).toBe(true)
    expect(search.get('center')).toBe('2.3522,48.8566')
    expect(search.get('q')).toBe('Paris & Île-de-France #1')
    expect([...search.keys()]).toEqual(['center', 'q'])
  })

  // Why `MapSearch` assigns it with no gate of its own: every value this can
  // produce is a path on this site, so a gate here could only ever pass.
  it('is always a site path, in every locale', () => {
    expect(isSitePath(classMapSearchHref('en', london))).toBe(true)
    expect(isSitePath(classMapSearchHref('fr', london))).toBe(true)
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

  it('accepts an off-site URL by its own spelling, not borrowing our scheme', () => {
    expect(isSafeNavigationUrl('https://other.example/thanks')).toBe(true)
    expect(isSafeNavigationUrl('//other.example/thanks')).toBe(false)
  })

  it('answers `//host` as `isSafeLinkHref` does', () => {
    // One string, one answer. The file held two views of it before (#257).
    for (const url of ['//other.example/thanks', '//cdn.example.com']) {
      expect(isSafeNavigationUrl(url), url).toBe(isSafeLinkHref(url))
    }
  })

  it('still reads `/\\host` as a path, which is `isSitePath`’s limit', () => {
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

  it('normalizes the path, so one page cannot yield two locale URLs', () => {
    expect(sitePathFromUrl(`${ORIGIN}/map/gb/`, ORIGIN)).toBe('/map/gb')
    expect(sitePathFromUrl(`${ORIGIN}/map/gb/?locale=fr`, ORIGIN)).toBe('/map/gb?locale=fr')
    expect(sitePathFromUrl(`${ORIGIN}/index`, ORIGIN)).toBe('/')
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

describe('isSafeLinkHref', () => {
  it('admits every spelling an editor legitimately types', () => {
    for (const href of [
      'https://example.com',
      'http://example.com/x?q=1',
      'mailto:hello@example.com',
      'tel:+1234567890',
      '/meditations',
      '/',
      '#section',
    ]) {
      expect(isSafeLinkHref(href), href).toBe(true)
    }
  })

  it('refuses a scheme that would execute rather than navigate', () => {
    for (const href of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
    ]) {
      expect(isSafeLinkHref(href), href).toBe(false)
    }
  })

  it('refuses a protocol-relative URL and an unset href', () => {
    // `//host` names another origin and borrows our scheme. The plain
    // `https://host` spelling of the same destination is already admitted,
    // and an empty href reloads the page the visitor is already on.
    expect(isSafeLinkHref('//cdn.example.com/x')).toBe(false)
    expect(isSafeLinkHref('')).toBe(false)
  })

  it('refuses a bare relative href, which no route here serves', () => {
    expect(isSafeLinkHref('about')).toBe(false)
    expect(isSafeLinkHref('?q=1')).toBe(false)
  })
})

describe('absoluteHref', () => {
  it('names a page of ours in full, locale prefix included', () => {
    expect(absoluteHref(ORIGIN, 'en', '/meditations/5')).toBe(`${ORIGIN}/meditations/5`)
    expect(absoluteHref(ORIGIN, 'fr', '/meditations/5')).toBe(`${ORIGIN}/fr/meditations/5`)
  })

  it('spells the home page the way the canonical does', () => {
    expect(absoluteHref(ORIGIN, 'en', '/')).toBe(`${ORIGIN}/`)
    expect(absoluteHref(ORIGIN, 'fr', '/')).toBe(`${ORIGIN}/fr`)
  })

  it('leaves an off-site URL alone, as localeHref does', () => {
    expect(absoluteHref(ORIGIN, 'fr', 'https://example.com/x')).toBe('https://example.com/x')
  })
})

describe('encodeUrl', () => {
  it.each([
    ['https://wemeditate.com/bg/софия', 'https://wemeditate.com/bg/%D1%81%D0%BE%D1%84%D0%B8%D1%8F'],
    ['https://wemeditate.com/de/universität', 'https://wemeditate.com/de/universit%C3%A4t'],
    ['https://wemeditate.com/a?x=1&y=2#top', 'https://wemeditate.com/a?x=1&y=2#top'],
    ['https://wemeditate.com/a b', 'https://wemeditate.com/a%20b'],
    ['https://wemeditate.com/%D1%81', 'https://wemeditate.com/%D1%81'],
  ])('%s', (url, expected) => {
    expect(encodeUrl(url)).toBe(expected)
    expect(encodeUrl(expected)).toBe(expected)
  })

  it('encodes the URL a locale builder emits for a native-letter path', () => {
    expect(localeUrl(ORIGIN, 'bg', '/map/bg/софия')).toBe(
      `${ORIGIN}/bg/map/bg/%D1%81%D0%BE%D1%84%D0%B8%D1%8F`,
    )
    expect(absoluteHref(ORIGIN, 'en', '/map/de/universität-trier')).toBe(
      `${ORIGIN}/map/de/universit%C3%A4t-trier`,
    )
  })
})
