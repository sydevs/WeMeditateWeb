/**
 * Shared rule for "is this page one of the site's featured top-level nav pages"
 * — the pages the header renders as plain nav links (settings.featuredPages).
 *
 * Both current-page behaviours key off the same fact — the current page's slug
 * matching a featured page's slug — so they can't drift:
 *  - the header highlights the matching nav link (LayoutChrome compares each
 *    featured page's slug to the current page's slug), and
 *  - the page suppresses its own PageTitle banner via this predicate, since the
 *    highlighted nav link already names the page (pages/[slug]/+Page.tsx).
 *
 * Kept framework-free so the membership test can be unit-tested without rendering.
 */
import type { Page, WebConfig } from '../server/cms-types'

/** True when `page` is one of the featured top-level nav pages. */
export function isFeaturedNavPage(
  page: Pick<Page, 'slug'>,
  settings: Pick<WebConfig, 'featuredPages'>,
): boolean {
  return settings.featuredPages.some((featured) => featured.slug === page.slug)
}
