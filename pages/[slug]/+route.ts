import { MAP_PREFIX } from '../../lib/atlas-route'

/**
 * First path segments that a route function elsewhere owns. This matcher
 * must not swallow them.
 *
 * ⚠ This matcher is greedy: it matches any single segment. Before this
 * exclusion, `/map` resolved to the Pages renderer, silently, and rendered
 * "page not found" for a route that exists. A filesystem route under
 * `pages/map/` does not win on its own, because `pages/map/+route.ts` is
 * also a route function. Vike's router sees both candidates.
 *
 * This list derives from `MAP_PREFIX`, instead of a hardcoded string. If
 * the atlas prefix moves, this list cannot point at the old one.
 */
const RESERVED_SEGMENTS: ReadonlySet<string> = new Set([MAP_PREFIX.replace(/^\//, '')])

/**
 * Route matcher for pages in default locale (English).
 * Matches: /about, /contact, etc.
 * Does not match: / (homepage), /cs/*, /de/*, /map, etc.
 */
export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Do not match the homepage
  if (urlPathname === '/') {
    return false
  }

  // Do not match locale-prefixed routes (handled by [locale]/[slug])
  if (urlPathname.match(/^\/[a-z]{2}\//)) {
    return false
  }

  // Match single-level paths like /about, /contact
  const match = urlPathname.match(/^\/([^/]+)\/?$/)

  if (match && !RESERVED_SEGMENTS.has(match[1])) {
    return {
      routeParams: {
        slug: match[1],
      },
    }
  }

  return false
}
