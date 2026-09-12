/**
 * Smoke specs for the WeMeditate web app (Workers preview) page rendering.
 *
 * Verifies the Worker loads real content from the production CMS: the
 * homepage, a real CMS page, a non-English locale homepage, the
 * default-locale canonical redirect, and the 404 path. These are
 * always-present surfaces. They should never silently break.
 *
 * Conventions confirmed against the deployed Worker:
 *  - A locale root has no trailing slash. "/es/" 301s to "/es".
 *  - The default locale is stripped. "/en" 301s to "/index" (the homepage).
 *  - An unknown path returns a real 404 (the ErrorFallback "Content Not Found" page).
 */
import { describe, it, expect } from 'vitest'
import {
  fetchPage,
  expectRenders,
  expectChrome,
  expectNoChrome,
  expectNoBrokenLinks,
  discoverFromCms,
  NOT_FOUND_MARKER,
} from '../_helpers/preview'

describe('web preview pages', () => {
  it('homepage renders with real content and working navigation', async () => {
    const home = await fetchPage('/')

    expectRenders(home, '/')
    expectChrome(home, '/')
    // The layout nav is built from WebConfig page relationships. An
    // under-populated read renders /undefined hrefs (200 but dead nav).
    // Guard against that.
    expectNoBrokenLinks(home.html, '/')
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

  it('a non-English locale homepage renders', async (ctx) => {
    // Ask the CMS which locales the site offers rather than hardcoding one.
    // A prefix outside `availableLocales` now 404s by design, so a spec
    // pinned to "/es" would fail the day an editor stops offering Spanish —
    // and reports that as a broken deploy rather than a config change.
    const offered = (await discoverFromCms())?.availableLocales ?? []
    const locale = offered.find((code) => code !== 'en')

    ctx.skip(
      !locale,
      'the site offers English only (or no CMS key); nothing to check for a non-English locale',
    )

    // Locale roots live without a trailing slash ("/es/" 301s to "/es").
    const page = await fetchPage(`/${locale}`)

    expectRenders(page, `/${locale}`)
  })

  it('a locale the site does not offer returns 404', async () => {
    // `availableLocales` is the whole locale set: a prefix outside it is
    // not a page. "zz" is not a CMS locale at all, so it can never be
    // offered, whatever an editor configures.
    const res = await fetchPage('/zz/about')

    expect(res.status, 'an unoffered locale prefix should 404').toBe(404)
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
    expect(res.html, '404 should render the Content Not Found page').toContain(
      NOT_FOUND_MARKER,
    )
    // The error page carries no settings, so LayoutChrome falls back to bare —
    // the _error route must never render with site chrome.
    expectNoChrome(res, '/__smoke_does_not_exist__')
  })
})
