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
const settings = { homePage: null as { slug: string } | null, availableLocales: ['en'], audiences: [] }

vi.mock('../../server/cms-client', () => ({
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
})
