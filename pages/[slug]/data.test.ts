/**
 * What the Pages data hook does before it renders a document.
 *
 * No `+` prefix on the filename: Vike loads every `+`-prefixed file under
 * `pages/` as a config file. See docs/rules/testing.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PageContextServer } from 'vike/types'

const getPageBySlug = vi.fn()
const getPageLocaleStatus = vi.fn()
const settings = {
  homePage: null as { slug: string } | null,
  availableLocales: ['en'] as string[],
  audiences: [],
}

vi.mock('../../server/sahajcloud-client', () => ({
  getPageBySlug: (...args: unknown[]) => getPageBySlug(...args),
  getPageLocaleStatus: (...args: unknown[]) => getPageLocaleStatus(...args),
}))
vi.mock('../../server/site-context', () => ({
  loadSiteContext: async () => ({ settings, t: () => '' }),
}))
vi.mock('../../server/live-preview', () => ({
  loadLivePreview: async () => ({ enabled: false }),
  previewArgs: () => ({}),
}))
vi.mock('../../server/content-index', () => ({
  resolveContentIndexBlocks: async (content: unknown) => content,
}))

const { data } = await import('./+data')

/** Vike stamps a thrown `redirect()` with the target it resolved. */
interface AbortError {
  _pageContextAbort?: { _urlRedirect?: { url: string; statusCode: number } }
}

/**
 * Whether the request renders the 404 state rather than redirecting.
 *
 * `redirectOf` rethrows a `render()` abort, because a 404 where a redirect was
 * expected is a failure worth reading the stack of. The cases below want the
 * 404 itself, so they ask for it by name.
 */
async function renders404(slug: string, locale = 'en') {
  try {
    await data({ locale, routeParams: { slug } } as unknown as PageContextServer)
  } catch (error) {
    const abort = (error as AbortError)._pageContextAbort

    return abort !== undefined && abort._urlRedirect === undefined
  }

  return false
}

/** The redirect a request throws, or `null` when it renders instead. */
async function redirectOf(slug: string, locale = 'en') {
  try {
    await data({ locale, routeParams: { slug } } as unknown as PageContextServer)
  } catch (error) {
    const target = (error as AbortError)._pageContextAbort?._urlRedirect

    if (!target) throw error

    return { url: target.url, status: target.statusCode }
  }

  return null
}

beforeEach(() => {
  settings.homePage = null
  settings.availableLocales = ['en']
  getPageBySlug.mockResolvedValue({ id: 7, slug: 'about', content: [] })
  getPageLocaleStatus.mockResolvedValue({})
})

describe('Pages data', () => {
  it('serves an ordinary page at its own slug', async () => {
    expect(await redirectOf('about')).toBeNull()
  })

  it('redirects the home document away from its own slug', async () => {
    // `homePage` already answers at `/`. Serving it at `/welcome` too would
    // put one document at two URLs, which is #114's shape at a second URL.
    settings.homePage = { slug: 'welcome' }

    expect(await redirectOf('welcome')).toEqual({ url: '/', status: 302 })
  })

  it('redirects to the home URL of the requested locale', async () => {
    settings.homePage = { slug: 'welcome' }

    expect(await redirectOf('welcome', 'fr')).toEqual({ url: '/fr', status: 302 })
  })

  it('redirects even when that document is unpublished in the locale', async () => {
    // A 404 here would advertise the home page as missing at a URL that is
    // simply the wrong one for it.
    settings.homePage = { slug: 'welcome' }
    getPageBySlug.mockResolvedValue(null)

    expect(await redirectOf('welcome')).toMatchObject({ url: '/' })
  })

  it('leaves every slug alone while `homePage` carries none', async () => {
    // The live config's home document has an empty slug, so no URL collides.
    settings.homePage = { slug: '' }

    expect(await redirectOf('about')).toBeNull()
  })

  it('does not redirect `/` to itself when the home page is slugged `index`', async () => {
    // `/` routes as `index`, so a home document an editor slugged `index`
    // would match the self-redirect above and loop the site's front page.
    settings.homePage = { slug: 'index' }
    getPageBySlug.mockResolvedValue({ id: 1, slug: 'index', content: [] })

    expect(await redirectOf('index')).toBeNull()
  })

  it('reads `/` through the same page read as any slug, not from the config', async () => {
    settings.homePage = { slug: '' }
    getPageBySlug.mockResolvedValue({ id: 1, slug: '', content: [] })

    const result = await data({ locale: 'fr', routeParams: { slug: 'index' } } as never)

    expect(getPageBySlug).toHaveBeenLastCalledWith({ slug: '', locale: 'fr' })
    expect(getPageLocaleStatus).toHaveBeenLastCalledWith({ slug: '' })
    expect(result.page).toMatchObject({ id: 1 })
  })
})

describe('a page the reader’s language has no translation of', () => {
  beforeEach(() => {
    settings.availableLocales = ['en', 'it']
    getPageBySlug.mockResolvedValue(null)
    getPageLocaleStatus.mockResolvedValue({ en: 'published' })
  })

  it('lands on the English page instead of a 404', async () => {
    expect(await redirectOf('about', 'it')).toEqual({ url: '/about', status: 302 })
  })

  it('is a 302, so publishing the translation changes where the URL lands', async () => {
    // A 301 would be cached indefinitely, pinning the reader to English for
    // as long as the browser keeps it.
    expect((await redirectOf('about', 'it'))?.status).toBe(302)
  })

  it('sends the home page to `/`, not to `/index`', async () => {
    settings.homePage = { slug: 'welcome' }

    // `/` routes as `index`, which is a routing spelling and never a URL.
    expect(await redirectOf('index', 'it')).toEqual({ url: '/', status: 302 })
  })

  it('leaves the 404 standing when the status read failed', async () => {
    // `getPageLocaleStatus` answers `{}` on failure. Reading that as "English
    // is not published" is right: nothing is known, so nothing is claimed.
    getPageLocaleStatus.mockResolvedValue({})

    expect(await renders404('about', 'it')).toBe(true)
  })

  it('leaves the 404 standing when English itself is unpublished', async () => {
    getPageLocaleStatus.mockResolvedValue({ it: 'published' })

    expect(await renders404('about', 'it')).toBe(true)
  })

  it('leaves the 404 standing for an English request', async () => {
    // Nothing to fall back to, and `/about` → `/about` would loop.
    expect(await renders404('about', 'en')).toBe(true)
  })

  it('leaves the 404 standing when the site does not offer English', async () => {
    // `advertisedLocales` wants both halves: a locale this site switched off
    // has no URL to point at, and `server/site-context.ts` would 404 it.
    settings.availableLocales = ['it']

    expect(await renders404('about', 'it')).toBe(true)
  })
})
