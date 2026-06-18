import { describe, it, expect } from 'vitest'
import { pageToArticle, pageToLink, pickFeaturedArticles } from './headerDropdown'
import type { Page } from '../server/cms-types'

const page = (over: Partial<Page>): Page => ({ id: 1, slug: 's', title: 'T', ...over }) as Page

describe('pageToLink', () => {
  it('maps a page to a slug-rooted nav link', () => {
    expect(pageToLink(page({ title: 'Kundalini', slug: 'kundalini' }))).toEqual({
      label: 'Kundalini',
      href: '/kundalini',
    })
  })
})

describe('pageToArticle', () => {
  it('resolves a populated meta.image to its URL', () => {
    const article = pageToArticle(
      page({
        title: 'History',
        slug: 'history',
        meta: { image: { url: 'https://imagedelivery.net/x/y/' } } as Page['meta'],
      }),
    )

    expect(article).toEqual({
      title: 'History',
      image: 'https://imagedelivery.net/x/y/',
      imageAlt: 'History',
      href: '/history',
    })
  })

  it('uses meta.title for alt text when present', () => {
    const article = pageToArticle(
      page({
        title: 'History',
        slug: 'history',
        meta: { title: 'A History of Meditation' } as Page['meta'],
      }),
    )

    expect(article.imageAlt).toBe('A History of Meditation')
  })

  it('falls back gracefully (empty image) when meta.image is missing', () => {
    expect(pageToArticle(page({ title: 'No Image', slug: 'no-image' })).image).toBe('')
  })
})

describe('pickFeaturedArticles', () => {
  const featured = [page({ id: 1 }), page({ id: 2 }), page({ id: 3 }), page({ id: 4 })]
  const fallback = [page({ id: 10 }), page({ id: 11 })]

  it('falls back to knowledge pages when featured is empty', () => {
    expect(pickFeaturedArticles([], fallback)).toEqual(fallback)
  })

  it('returns all available when fewer than count exist (render what exists)', () => {
    const one = [page({ id: 99 })]

    expect(pickFeaturedArticles(one, fallback)).toHaveLength(1)
  })

  it('picks exactly count distinct pages from a longer list', () => {
    // random() = 0 always → partial Fisher–Yates keeps the first `count` items.
    const picks = pickFeaturedArticles(featured, fallback, 2, () => 0)

    expect(picks).toHaveLength(2)
    expect(new Set(picks.map((p) => p.id)).size).toBe(2)
    // Every pick is a member of the source list.
    expect(picks.every((p) => featured.includes(p))).toBe(true)
  })

  it('does not mutate the input arrays', () => {
    const ids = featured.map((p) => p.id)

    pickFeaturedArticles(featured, fallback, 2, () => 0.5)
    expect(featured.map((p) => p.id)).toEqual(ids)
  })
})
