/**
 * Smoke specs for the WeMeditate web app (Workers preview) page rendering.
 *
 * Verifies the Worker loads real content from the production CMS: the homepage,
 * a real CMS page, a non-English locale homepage, the default-locale canonical
 * redirect, and the 404 path. These are always-present surfaces that should
 * never silently break.
 *
 * Conventions confirmed against the deployed Worker:
 *  - Locale roots have NO trailing slash; "/es/" 301s to "/es".
 *  - The default locale is stripped: "/en" 301s to "/index" (the homepage).
 *  - Unknown paths return a real 404 (the ErrorFallback "Content Not Found" page).
 */
import { describe, it, expect } from 'vitest'
import { fetchPage, expectRenders, discoverFromCms } from '../_helpers/preview'

describe('web preview pages', () => {
  it('homepage renders with real content', async () => {
    const home = await fetchPage('/')

    expectRenders(home, '/')
  })

  it('a CMS page renders with real content', async (ctx) => {
    // Discover a real published page slug from the CMS rather than crawling the
    // homepage (nav links may be hydrated client-side, not in the SSR HTML).
    const slug = (await discoverFromCms())?.pageSlug

    ctx.skip(
      !slug,
      'no CMS page slug available; set the SAHAJCLOUD_API_KEY secret for content-page coverage',
    )

    const page = await fetchPage(`/${slug}`)

    expectRenders(page, `/${slug}`)
  })

  it('a non-English locale homepage renders', async () => {
    // Locale roots live without a trailing slash ("/es/" 301s to "/es").
    const es = await fetchPage('/es')

    expectRenders(es, '/es')
  })

  it('canonicalizes the default (en) locale away via a 301 redirect', async () => {
    const res = await fetchPage('/en', { redirect: 'manual' })

    expect(res.status, '/en should 301 to the de-localized path').toBe(301)
    expect(res.location, '/en redirect should set a Location header').toBeTruthy()
    expect(res.location, 'redirect target should drop the /en prefix').not.toMatch(/\/en(\/|$)/)
  })

  it('returns a 404 page for unknown paths', async () => {
    const res = await fetchPage('/__smoke_does_not_exist__')

    expect(res.status, 'unknown path should return 404').toBe(404)
    // ErrorType.CLIENT title from ErrorFallback (see ERROR_MARKERS).
    expect(res.html, '404 should render the Content Not Found page').toContain('Content Not Found')
  })
})
