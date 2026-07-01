/**
 * Shared rule for "is this page one of the site's featured top-level nav pages"
 * — the pages the header renders as plain nav links (settings.featuredPages).
 *
 * Kept framework-free and centralised so the two places that care agree:
 *  - the header highlights the matching nav link (LayoutChrome), and
 *  - the page suppresses its own PageTitle banner, since the highlighted nav
 *    link already names the page (pages/[slug]/+Page.tsx → PageTemplate).
 */
import type { Page, WebConfig } from '../server/cms-types'

/** True when `page` is one of the featured top-level nav pages. */
export function isFeaturedNavPage(
  page: Pick<Page, 'slug'>,
  settings: Pick<WebConfig, 'featuredPages'>,
): boolean {
  return settings.featuredPages.some((featured) => featured.slug === page.slug)
}
