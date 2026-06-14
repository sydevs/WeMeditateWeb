/**
 * Smoke specs for page rendering against the deployed Cloudflare preview.
 *
 * Verifies the Worker loads real content from the production CMS: the homepage,
 * the featured/content pages it links to, a non-English locale, the /en/
 * canonical redirect, and the 404 path. These are the always-present surfaces
 * that should never silently break.
 */
import { describe, it, expect } from 'vitest'
import { fetchPage, expectRenders, internalLinks } from './_helpers/preview'

const RESERVED_SEGMENTS = new Set(['preview', 'sentry'])

/** A single-segment CMS page slug (e.g. /about), not a locale, asset, or route prefix. */
function isContentPage(path: string): boolean {
  if (path === '/' || !/^\/[^/]+$/.test(path)) return false
  if (/^\/[a-z]{2}(-[A-Z]{2})?$/.test(path)) return false // locale homepage
  if (path.includes('.')) return false // static asset

  return !RESERVED_SEGMENTS.has(path.slice(1))
}

describe('preview pages', () => {
  it('homepage renders with navigation', async () => {
    const home = await fetchPage('/')

    expectRenders(home, '/')
    expect(
      internalLinks(home.html).length,
      'homepage should render internal navigation links',
    ).toBeGreaterThan(0)
  })

  it('content pages linked from the homepage render with real content', async () => {
    const home = await fetchPage('/')
    const slugs = internalLinks(home.html).filter(isContentPage).slice(0, 8)

    expect(
      slugs.length,
      'expected at least one content page (featuredPages) linked from the homepage',
    ).toBeGreaterThan(0)

    for (const slug of slugs) {
      const page = await fetchPage(slug)

      expectRenders(page, slug)
    }
  })

  it('a non-English locale homepage renders', async () => {
    const es = await fetchPage('/es/')

    expectRenders(es, '/es/')
  })

  it('canonicalizes the /en/ locale prefix with a 301 redirect', async () => {
    const res = await fetchPage('/en/', { redirect: 'manual' })

    expect(res.status, '/en/ should 301 to the de-localized path').toBe(301)
    expect(res.location, '/en/ redirect should set a Location header').toBeTruthy()
    expect(res.location, 'redirect target should drop the /en prefix').not.toMatch(/\/en(\/|$)/)
  })

  it('returns a 404 page for unknown paths', async () => {
    const res = await fetchPage('/__smoke_does_not_exist__')

    expect(res.status, 'unknown path should return 404').toBe(404)
    // ErrorType.CLIENT title from ErrorFallback (see ERROR_MARKERS).
    expect(res.html, '404 should render the Content Not Found page').toContain('Content Not Found')
  })
})
