import { describe, it, expect } from 'vitest'
import type { Page, WebConfig } from '../server/cms-types'
import { activeFeaturedSlug, isFeaturedNavPage } from './featured-nav'

/** Minimal featured-page list keyed by slug. Only `slug` is read. */
function settings(slugs: string[]): Pick<WebConfig, 'featuredPages'> {
  return { featuredPages: slugs.map((slug) => ({ slug }) as Page) }
}

describe('activeFeaturedSlug', () => {
  it('returns the slug when the current page is a featured nav page', () => {
    expect(activeFeaturedSlug('meditate', settings(['meditate', 'music']))).toBe('meditate')
  })

  it('returns undefined for a page that is not featured', () => {
    expect(activeFeaturedSlug('about', settings(['meditate', 'music']))).toBeUndefined()
  })

  it('returns undefined when there is no current slug (non-[slug] routes)', () => {
    expect(activeFeaturedSlug(undefined, settings(['meditate']))).toBeUndefined()
  })

  it('returns undefined when there are no featured pages', () => {
    expect(activeFeaturedSlug('meditate', settings([]))).toBeUndefined()
  })
})

describe('isFeaturedNavPage', () => {
  it('is true when the page slug is one of the featured nav pages', () => {
    expect(isFeaturedNavPage({ slug: 'meditate' }, settings(['meditate', 'music']))).toBe(true)
  })

  it('is false for a page that is not featured', () => {
    expect(isFeaturedNavPage({ slug: 'about' }, settings(['meditate', 'music']))).toBe(false)
  })

  it('is false when there are no featured pages', () => {
    expect(isFeaturedNavPage({ slug: 'meditate' }, settings([]))).toBe(false)
  })
})

// The nav highlight (LayoutChrome) and the title suppression (+Page) both
// key off activeFeaturedSlug. A page hides its title only when its own
// nav link is the active one.
describe('highlight and title-suppression agree', () => {
  const s = settings(['meditate', 'music'])

  it('a featured page suppresses its title and matches exactly its own nav link', () => {
    const page = { slug: 'music' }
    const active = activeFeaturedSlug(page.slug, s)

    expect(isFeaturedNavPage(page, s)).toBe(true)
    expect(active).toBe('music')
    // Exactly one featured nav item is active, and it is this page's.
    expect(s.featuredPages.filter((f) => f.slug === active)).toHaveLength(1)
  })

  it('a non-featured page keeps its title and activates no nav link', () => {
    const page = { slug: 'about' }
    const active = activeFeaturedSlug(page.slug, s)

    expect(isFeaturedNavPage(page, s)).toBe(false)
    expect(s.featuredPages.filter((f) => f.slug === active)).toHaveLength(0)
  })
})
