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

/** Vike stamps a thrown `redirect()` with the target it resolved. */
interface AbortError {
  _pageContextAbort?: { _urlRedirect?: { url: string; statusCode: number } }
}

/**
 * The redirect a path throws, read off the abort.
 *
 * `routeOf` returns before the throw, so a spec that asserts a target has to
 * catch the abort instead of calling the hook for its result.
 */
function redirectOf(pathname: string, search = '') {
  try {
    onBeforeRoute(ctx(pathname, search))
  } catch (error) {
    const target = (error as AbortError)._pageContextAbort?._urlRedirect

    if (!target) throw error

    const url = new URL(target.url)

    return { path: url.pathname, search: url.search, status: target.statusCode }
  }

  throw new Error(`${pathname} rendered instead of redirecting`)
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
    expect(redirectOf('/en/about')).toEqual({ path: '/about', search: '', status: 301 })
  })

  it('keeps the query string on that redirect', () => {
    expect(redirectOf('/en/about', '?x=1')).toMatchObject({ path: '/about', search: '?x=1' })
  })

  it('drops a trailing slash from the redirect target', () => {
    // /about/ and /about both render, and /about is the canonical, so the
    // 301 must not land on the duplicate.
    expect(redirectOf('/en/about/')).toMatchObject({ path: '/about' })
  })

  it('sends /en to the home page in one hop, not to /index', () => {
    // /index is the routing spelling below. It renders the home page at a
    // second URL, whose own canonical is /, so a 301 must never point there.
    expect(redirectOf('/en')).toMatchObject({ path: '/' })
    expect(redirectOf('/en/')).toMatchObject({ path: '/' })
    expect(redirectOf('/en/index')).toMatchObject({ path: '/' })
  })

  it('sends a requested /index to the home URL of its locale', () => {
    expect(redirectOf('/index')).toMatchObject({ path: '/', status: 301 })
    expect(redirectOf('/index/')).toMatchObject({ path: '/' })
    expect(redirectOf('/fr/index')).toMatchObject({ path: '/fr', status: 301 })
    expect(redirectOf('/pt-BR/index')).toMatchObject({ path: '/pt-BR' })
  })

  it('still routes a bare root, which spells itself /index', () => {
    // The spelling the hook invents must not be mistaken for a requested one.
    expect(routeOf('/')).toEqual({ locale: 'en', path: '/index' })
    expect(routeOf('/fr/')).toEqual({ locale: 'fr', path: '/index' })
  })

  it('leaves /index under a deeper path alone', () => {
    expect(routeOf('/about/index')).toEqual({ locale: 'en', path: '/about/index' })
  })

  it('leaves a segment that only looks like a locale alone', () => {
    // `st` is not a CMS locale, so /status/ is a path, not a prefix. It
    // then 404s through the route it really matched, rather than rendering
    // the site under an invented locale.
    expect(routeOf('/status/page')).toEqual({ locale: 'en', path: '/status/page' })
    expect(routeOf('/pt-br/about')).toEqual({ locale: 'en', path: '/pt-br/about' })
  })
})
