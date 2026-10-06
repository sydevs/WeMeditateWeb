/**
 * Resolves an atlas route (the `/nl/amsterdam` string under this site's
 * `/map` prefix) to the region, event, or atlas root it names.
 *
 * ⚠ This is a deliberate port, not an independent implementation. The rule
 * is mirrored from `parseAtlasRoute` in SahajCloud
 * (`src/endpoints/atlas/seo/atlasRoute.ts`), which in turn mirrors
 * `resolveStack` in SahajAtlasWeb (`src/lib/shape/path.ts`). All three must
 * agree on what a route is of: the page this site server-renders, the
 * endpoint that describes it, and the widget that upgrades over it. If
 * they disagree, a page's canonical describes a different document than
 * its body, the exact failure canonicals exist to prevent. Change this
 * only in step with the other two.
 *
 * This function parses locally, instead of asking the endpoint, because
 * the answer decides things before the call: which cache TTL applies (a
 * class's schedule moves more often than a region's identity), and whether
 * the string is a route at all. Only the second is a reason not to call:
 * every route the endpoint will read is read, the atlas root included.
 *
 * This module is pure and env-free. It decides what to read.
 * {@link getAtlasSeo} does the read.
 */

/**
 * Words that never name a region, dropped wherever they appear.
 *
 * `search`, `calendar`, `filters`, `register`, `share`, and `online` are
 * the widget's own routed views. `preview` is its live-preview boot route.
 * Each is a view of the entity beside it, so dropping it leaves the
 * entity the page is actually about (`/gb/london/1204/register` becomes
 * event 1204). `events`, `areas`, `regions`, and `venues` are legacy Atlas
 * URL prefixes with no view of their own, so dropping them makes an old
 * inbound link resolve to the same document its modern route does.
 *
 * The same set as `RESERVED_SLUGS` in the widget, matched case-insensitively.
 */
const RESERVED_SEGMENTS: ReadonlySet<string> = new Set([
  'search',
  'calendar',
  'filters',
  'register',
  'share',
  'online',
  'preview',
  'events',
  'areas',
  'regions',
  'venues',
])

/**
 * Longest route this function will parse, matching the endpoint's own
 * ceiling. Far above any real route: the deepest region chain is four
 * levels (country, region, city, venue), plus an event ID.
 */
export const MAX_ATLAS_ROUTE_LENGTH = 512

/** Ceiling on segment count, for the same reason. Real routes use at most five. */
const MAX_ATLAS_ROUTE_SEGMENTS = 12

/** Largest event ID this function accepts: Postgres `int4`, the column type. */
const MAX_EVENT_ID = 2147483647

/**
 * What a route names.
 *
 * `region` and `event` are keyed by the terminal segment alone. This is the
 * widget's and the endpoint's rule: a region slug is globally unique, and
 * an event ID needs no ancestry. Everything before the terminal segment is
 * ancestry, the part of a URL that goes stale when a region moves in the
 * tree, or a country is re-slugged to its ISO code. Ignoring ancestry
 * means an old inbound link still resolves, and the answer's `route` and
 * `canonical` name the URL to redirect to. Refusing it would 404 every
 * link into a restructured subtree.
 *
 * `root` carries no key. It is what a route reduces to when nothing but
 * view segments and legacy prefixes remain.
 */
export type AtlasRouteTarget =
  { kind: 'root' } | { kind: 'region'; slug: string } | { kind: 'event'; id: number }

/** Decode one segment, tolerating a malformed `%` escape (returns it unchanged). */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * What a route names — a region, an event, or the atlas root — or `null`
 * when the string is not a route at all.
 *
 * "Names nothing" and "is not a route" are different answers. A route that
 * reduces to no segments is the root: `/` itself, and every bare view route
 * (`/search`, `/calendar`), since a view of the root is still the root.
 * Those are the routes this site actually mounts, and SahajCloud describes
 * them with its `type: 'root'` answer.
 *
 * `null` stays reserved for a string to refuse: over
 * {@link MAX_ATLAS_ROUTE_LENGTH}, carrying a query, fragment or whitespace,
 * or over the segment cap. Collapsing those into the root would answer a
 * malformed URL with a real page.
 */
export function parseAtlasRoute(route: string): AtlasRouteTarget | null {
  if (typeof route !== 'string' || route.length > MAX_ATLAS_ROUTE_LENGTH) {
    return null
  }

  // A query or fragment is the host page's own, not part of the atlas route.
  // Refuse rather than guess which half was meant.
  if (/[?#\s]/.test(route)) {
    return null
  }

  const raw = route.split('/').filter(Boolean).map(safeDecode)

  // Measured before reserved words are dropped, so a route of twenty
  // `/search` segments stays unparseable instead of reducing to the root. A
  // caller sending nonsense has not named a landing page.
  if (raw.length > MAX_ATLAS_ROUTE_SEGMENTS) {
    return null
  }

  const segments = raw.filter((segment) => !RESERVED_SEGMENTS.has(segment.toLowerCase()))

  if (segments.length === 0) {
    return { kind: 'root' }
  }

  const terminal = segments[segments.length - 1]

  if (/^\d+$/.test(terminal)) {
    const id = Number(terminal)

    return id > 0 && id <= MAX_EVENT_ID ? { kind: 'event', id } : null
  }

  return { kind: 'region', slug: terminal }
}

/**
 * The path prefix this site serves the atlas under.
 *
 * Shared by the Vike route matcher, the sitemap, and the widget's
 * `routing=path` configuration, so all three agree on where the atlas lives.
 */
export const MAP_PREFIX = '/map'

/**
 * Matches an incoming URL against the `/map` routes, and returns the
 * atlas route it carries, or `false` when the URL does not belong to this
 * site.
 *
 * ```
 * /map                    → '/'
 * /map/nl/amsterdam       → '/nl/amsterdam'
 * /map/nl/amsterdam/1204  → '/nl/amsterdam/1204'
 * ```
 *
 * Depth is variable, which is why `pages/map/` uses a route function,
 * instead of a filesystem route: an atlas route runs from zero to five
 * segments, and Vike's filesystem router matches a fixed shape.
 *
 * An optional locale prefix is tolerated for the same reason
 * `matchDocumentRoute` tolerates one. `onBeforeRoute` normally strips it
 * into `urlLogical` before the router runs, but matching it here keeps
 * the matcher correct on its own, not dependent on that ordering.
 */
export function matchMapRoute(
  urlPathname: string,
): { routeParams: { atlasRoute: string } } | false {
  const match = urlPathname.match(/^(?:\/[a-z]{2}(?:-[A-Z]{2})?)?\/map(\/.*)?$/)

  if (!match) {
    return false
  }

  // `/map`, `/map/` and `/map` with a trailing slash all mean the atlas root.
  const rest = (match[1] ?? '').replace(/\/+$/, '')

  return { routeParams: { atlasRoute: rest === '' ? '/' : rest } }
}
