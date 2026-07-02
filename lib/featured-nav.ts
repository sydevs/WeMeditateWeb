/**
 * Shared rule for the featured top-level nav pages — the pages the header
 * renders as plain nav links (settings.featuredPages).
 *
 * Two current-page behaviours are driven off ONE primitive (`activeFeaturedSlug`)
 * so they can't drift:
 *  - the header highlights the featured nav link for the active slug (LayoutChrome), and
 *  - that page suppresses its own PageTitle banner (pages/[slug]/+Page.tsx),
 *    since the highlighted nav link already names it.
 *
 * Kept framework-free so the rule can be unit-tested without rendering.
 */
import type { Page, WebConfig } from '../server/cms-types'

/**
 * The slug of the featured nav page for the current page, or `undefined` when
 * the current page isn't a featured nav page.
 *
 * `currentSlug` and the featured pages' slugs come from the same-locale CMS
 * fetch (see pages/[slug]/+data), so matching by slug is correct in every locale.
 */
export function activeFeaturedSlug(
  currentSlug: string | undefined,
  settings: Pick<WebConfig, 'featuredPages'>,
): string | undefined {
  if (!currentSlug) return undefined

  return settings.featuredPages.find((featured) => featured.slug === currentSlug)?.slug
}

/** True when `page` is one of the featured top-level nav pages. */
export function isFeaturedNavPage(
  page: Pick<Page, 'slug'>,
  settings: Pick<WebConfig, 'featuredPages'>,
): boolean {
  return activeFeaturedSlug(page.slug, settings) !== undefined
}
