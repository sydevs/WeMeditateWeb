/**
 * Pure helpers for building the header mega-menu (HeaderDropdown) payload from
 * CMS pages. Kept framework-free so the mapping, image resolution, and random
 * selection can be unit-tested without rendering.
 */
import type { Page } from '../server/cms-types'
import { populatedImageUrl } from '../lib/cms-relationships'
import type { HeaderDropdownArticle, HeaderDropdownLink } from '../components/organisms'

/** A knowledge page → a left-column nav link (`/<slug>`). */
export function pageToLink(page: Page): HeaderDropdownLink {
  return { label: page.title, href: '/' + page.slug }
}

/**
 * A page → a featured-article card. Resolves the page's `meta.image`
 * relationship to a URL (empty string when none is populated — the article is
 * still linkable), and falls back to the page title for alt text.
 */
export function pageToArticle(page: Page): HeaderDropdownArticle {
  return {
    title: page.title,
    image: populatedImageUrl(page.meta?.image) ?? '',
    imageAlt: page.meta?.title ?? page.title,
    href: '/' + page.slug,
  }
}

/**
 * Pick `count` pages at random from the curated `featured` list (the CMS
 * `featuredArticles`, which may hold more than `count`), falling back to
 * `fallback` (knowledge pages) when `featured` is empty. Returns all available
 * pages when fewer than `count` exist. Pure: input arrays are not mutated and
 * `random` is injectable for deterministic tests.
 */
export function pickFeaturedArticles(
  featured: Page[],
  fallback: Page[],
  count = 2,
  random: () => number = Math.random,
): Page[] {
  const source = featured.length > 0 ? featured : fallback

  if (source.length <= count) return source.slice()

  // Partial Fisher–Yates: pick `count` distinct items without a full shuffle.
  const pool = source.slice()

  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i))

    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count)
}
