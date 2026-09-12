/**
 * Locale extraction from the URL.
 *
 * No `+` prefix on the filename: Vike loads every `+`-prefixed file under
 * `pages/` as a config file and fails the build when one exports neither
 * `route` nor `default`. See docs/rules/testing.md.
 */

import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from './+onBeforeRoute'

/** A minimal `urlParsed`, enough for the hook's three reads. */
function ctx(pathname: string, search = '') {
  return {
    urlParsed: {
      href: `https://wemeditate.com${pathname}${search}`,
      pathname,
      searchOriginal: search || null,
    },
  } as never
}

function routeOf(pathname: string, search = '') {
  const result = onBeforeRoute(ctx(pathname, search))

  return {
    locale: result.pageContext.locale,
    path: new URL(result.pageContext.urlLogical).pathname,
  }
}

describe('onBeforeRoute', () => {
  it('defaults to English with no prefix', () => {
    expect(routeOf('/about')).toEqual({ locale: 'en', path: '/about' })
  })

  it('maps the bare root to /index', () => {
    expect(routeOf('/')).toEqual({ locale: 'en', path: '/index' })
  })

  it('extracts a two-letter locale and strips it from the path', () => {
    expect(routeOf('/fr/about')).toEqual({ locale: 'fr', path: '/about' })
    expect(routeOf('/fa/map')).toEqual({ locale: 'fa', path: '/map' })
  })

  it('maps a locale root to /index', () => {
    expect(routeOf('/fr')).toEqual({ locale: 'fr', path: '/index' })
  })

  it('extracts a compound locale, region included', () => {
    expect(routeOf('/pt-BR/meditations/1')).toEqual({
      locale: 'pt-BR',
      path: '/meditations/1',
    })
    expect(routeOf('/en-AU/about')).toEqual({ locale: 'en-AU', path: '/about' })
  })

  it('redirects an explicit /en prefix to the bare path', () => {
    // English is served without a prefix, so /en/x is a permanent redirect.
    expect(() => routeOf('/en/about')).toThrow()
  })

  it('leaves a segment that only looks like a locale alone', () => {
    // `st` is not a CMS locale, so /status/ is a path, not a prefix. It
    // then 404s through the route it really matched, rather than rendering
    // the site under an invented locale.
    expect(routeOf('/status/page')).toEqual({ locale: 'en', path: '/status/page' })
    expect(routeOf('/pt-br/about')).toEqual({ locale: 'en', path: '/pt-br/about' })
  })
})
