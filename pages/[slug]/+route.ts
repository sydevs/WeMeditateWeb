import { MAP_PREFIX } from '../../lib/atlas-route'

/**
 * First path segments owned by a route function elsewhere, which this matcher
 * must not swallow.
 *
 * ⚠ **This matcher is greedy**: it matches *any* single segment, so `/map`
 * resolved to the Pages renderer — and did so silently, rendering "page not
 * found" for a route that exists. A filesystem route under `pages/map/` does not
 * win on its own, because `pages/map/+route.ts` is a route function and both
 * candidates are then offered to Vike's router.
 *
 * Derived from `MAP_PREFIX` rather than spelled out, so moving the atlas prefix
 * can't leave this list pointing at the old one.
 */
const RESERVED_SEGMENTS: ReadonlySet<string> = new Set([MAP_PREFIX.replace(/^\//, '')])

/**
 * Route matcher for pages in default locale (English).
 * Matches: /about, /contact, etc.
 * Does NOT match: / (homepage), /cs/*, /de/*, /map, etc.
 */
export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Don't match homepage
  if (urlPathname === '/') {
    return false
  }

  // Don't match locale-prefixed routes (handled by [locale]/[slug])
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
