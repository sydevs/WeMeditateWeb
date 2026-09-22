/**
 * Smoke specs for the WeMeditate web app (Workers preview) page rendering.
 *
 * Verifies the Worker loads real content from the production CMS: the
 * homepage, a real CMS page, a non-English locale homepage, the
 * default-locale canonical redirect, the SEO head tags, and the 404 path.
 * These are always-present surfaces. They should never silently break.
 *
 * Conventions confirmed against the deployed Worker:
 *  - A locale root has no trailing slash. "/es/" 301s to "/es".
 *  - The default locale is stripped. "/en" 301s to "/", the homepage itself.
 *  - "/index" is the router's own spelling of "/", not a URL. It 301s to "/".
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
  nonEnglishLocale,
  htmlTag,
  renderedHtml,
  NOT_FOUND_MARKER,
} from '../_helpers/preview'
import { localeDirection } from '../../../server/content-types'

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
    const locale = await nonEnglishLocale()

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
    // No route matches "/zz/about", so Vike renders the error page from the
    // already-routed pageContext. This flavour keeps its locale, and "zz" is
    // not one, so English is the right answer. It is the control for the
    // thrown-render() flavour below.
    expect(htmlTag(res.html), 'a no-route-matched 404 should stay English').toContain('lang="en"')
  })

  it('a 404 thrown from a data hook keeps the locale of its URL', async (ctx) => {
    // The affected flavour: the route matches, the data hook throws
    // `render(404)`, and Vike renders the error page from the PRE-routing
    // pageContext — the one +onBeforeRoute never touched. Missing the
    // locale there drops <html lang> and reads the translations global
    // with no locale, which then caches under a key every locale shares.
    const locale = await nonEnglishLocale()

    ctx.skip(!locale, 'the site offers English only (or no CMS key); no prefix to check')

    const res = await fetchPage(`/${locale}/__smoke_does_not_exist__`)

    expect(res.status, 'an unknown slug under a locale should 404').toBe(404)
    expect(htmlTag(res.html), 'the error page should carry the URL locale').toContain(
      `lang="${locale}"`,
    )
    // `localeDirection` is what `+htmlAttributes` calls, so this catches the
    // day the error page stops asking it rather than restating its answer.
    expect(htmlTag(res.html)).toContain(`dir="${localeDirection(locale!)}"`)
  })

  it('canonicalizes the default (en) locale away via a 301 redirect', async () => {
    const res = await fetchPage('/en', { redirect: 'manual' })

    expect(res.status, '/en should 301 to the de-localized path').toBe(301)
    expect(res.location, '/en redirect should set a Location header').toBeTruthy()
    // "/index" is the routing spelling of the home page, and renders it a
    // second time at 200. Asserting only the absence of "/en" passes either
    // way, so assert the target instead.
    expect(new URL(res.location!).pathname, '/en should land on the home page').toBe('/')
  })

  it('301s the routing spelling of the home page rather than serving it', async () => {
    const res = await fetchPage('/index', { redirect: 'manual' })

    expect(res.status, '/index should not be a second home page').toBe(301)
    expect(new URL(res.location!).pathname, '/index should land on /').toBe('/')
  })

  it('a content page carries a self-referential canonical', async (ctx) => {
    const slug = (await discoverFromCms())?.pageSlug

    ctx.skip(!slug, 'no CMS page slug available; set the SAHAJCLOUD_API_KEY secret')

    const page = await fetchPage(`/${slug}`)
    const origin = new URL(page.finalUrl).origin

    // The canonical is what makes the hreflang cluster count: Google
    // discards a cluster whose members are not self-canonical.
    expect(page.html, 'a content page should declare its own canonical').toContain(
      `<link href="${origin}/${slug}" rel="canonical"/>`,
    )
  })

  it('a content page advertises only locales it is published in', async (ctx) => {
    const discovered = await discoverFromCms()
    const slug = discovered?.pageSlug

    ctx.skip(!slug, 'no CMS page slug available; set the SAHAJCLOUD_API_KEY secret')

    const page = await fetchPage(`/${slug}`)
    const origin = new URL(page.finalUrl).origin
    const advertised = [...page.html.matchAll(/rel="alternate" hreflang="([^"]+)"/g)].map(
      (match) => match[1],
    )

    // English is served bare, and x-default points at that same URL.
    expect(advertised, 'the cluster should name the bare English URL').toContain('en')
    expect(page.html).toContain(
      `<link rel="alternate" hreflang="x-default" href="${origin}/${slug}"/>`,
    )
    // The site's locale set is a filter on the cluster, never the cluster
    // itself: a locale this page is not published in must not appear.
    const offered = new Set([...(discovered?.availableLocales ?? []), 'x-default'])

    expect(
      advertised.filter((code) => !offered.has(code)),
      'no advertised locale should sit outside availableLocales',
    ).toEqual([])
  })

  it('returns a 404 page for unknown paths', async () => {
    const res = await fetchPage('/__smoke_does_not_exist__')

    expect(res.status, 'unknown path should return 404').toBe(404)
    // ErrorType.CLIENT title from ErrorFallback (see ERROR_MARKERS). Match
    // the rendered markup: every page embeds the translations payload, which
    // carries this title too, so the raw body would match on any page.
    expect(renderedHtml(res.html), '404 should render the Content Not Found page').toContain(
      NOT_FOUND_MARKER,
    )
    // The error page carries no settings, so LayoutChrome falls back to bare —
    // the _error route must never render with site chrome.
    expectNoChrome(res, '/__smoke_does_not_exist__')
  })
})
