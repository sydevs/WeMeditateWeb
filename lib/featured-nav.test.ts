import { describe, it, expect } from 'vitest'
import type { Page, WebConfig } from '../server/cms-types'
import { isFeaturedNavPage } from './featured-nav'

/** Minimal featured-page list keyed by slug — only `slug` is read. */
function settings(slugs: string[]): Pick<WebConfig, 'featuredPages'> {
  return { featuredPages: slugs.map((slug) => ({ slug }) as Page) }
}

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
