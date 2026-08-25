/**
 * Resolve an atlas route — the `/nl/amsterdam` string under this site's `/map`
 * prefix — to the region or event it names.
 *
 * ⚠ **This is a deliberate port, not an independent implementation.** The rule
 * is mirrored from `parseAtlasRoute` in SahajCloud (`src/endpoints/atlas/seo/
 * atlasRoute.ts`), which in turn mirrors `resolveStack` in SahajAtlasWeb
 * (`src/lib/shape/path.ts`). All three must agree about what a route is *of*:
 * the page we server-render, the endpoint that describes it, and the widget
 * that upgrades over it. If they disagree, a page's canonical describes a
 * different document than its body — the exact failure canonicals exist to
 * prevent. Change this only in step with the other two.
 *
 * We parse locally rather than asking the endpoint because the answer decides
 * things *before* the call: which cache TTL applies (a class's schedule moves
 * more often than a region's identity), and whether the route names a document
 * at all — the atlas root and bare view routes have no document to describe, so
 * they must render the landing page instead of 404ing.
 *
 * Pure and env-free: this decides what to read, {@link getAtlasSeo} does the read.
 */

/**
 * Words that never name a region, dropped wherever they appear.
 *
 * `search` / `calendar` / `filters` / `register` / `share` / `online` are the
 * widget's own routed views and `preview` is its live-preview boot route: each
 * is a *view of* the entity beside it, so dropping it leaves the entity the page
 * is actually about (`/gb/london/1204/register` → event 1204). `events` /
 * `areas` / `regions` / `venues` are legacy Atlas URL prefixes carrying no view
 * of their own, so dropping them makes an old inbound link resolve to the same
 * document its modern route does.
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
 * Longest route we will parse, matching the endpoint's own ceiling. Far above
 * any real route: the deepest region chain is four levels (country → region →
 * city → venue) plus an event id.
 */
export const MAX_ATLAS_ROUTE_LENGTH = 512

/** Ceiling on segment count, for the same reason. Real routes use at most five. */
const MAX_ATLAS_ROUTE_SEGMENTS = 12

/** Largest event id we will accept — Postgres `int4`, which is the column type. */
const MAX_EVENT_ID = 2147483647

/**
 * What a route names.
 *
 * **Both variants are keyed by the terminal segment alone**, which is the
 * widget's and the endpoint's rule: a region slug is globally unique, and an
 * event id needs no ancestry. Everything before the terminal segment is
 * *ancestry* — the part of a URL that goes stale when a region moves in the tree
 * or a country is re-slugged to its ISO code. Ignoring it means an old inbound
 * link still resolves, and the answer's `route`/`canonical` name the URL to
 * redirect to. Refusing it would 404 every link into a restructured subtree.
 */
export type AtlasRouteTarget = { kind: 'region'; slug: string } | { kind: 'event'; id: number }

/** Decode one segment, tolerating a malformed `%` escape (returns it unchanged). */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * The region/event a route names, or `null` when it names neither — the atlas
 * root (`/`), a bare view route (`/search`), or anything unparseable.
 *
 * `null` is a real answer, not a failure: it means "this is the atlas landing
 * page", which we own the metadata for because there is no CMS document to
 * describe it with.
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

  const segments = route
    .split('/')
    .filter(Boolean)
    .map(safeDecode)
    .filter((segment) => !RESERVED_SEGMENTS.has(segment.toLowerCase()))

  if (segments.length === 0 || segments.length > MAX_ATLAS_ROUTE_SEGMENTS) {
    return null
  }

  const terminal = segments[segments.length - 1]

  if (/^\d+$/.test(terminal)) {
    const id = Number(terminal)

    return id > 0 && id <= MAX_EVENT_ID ? { kind: 'event', id } : null
  }

  return { kind: 'region', slug: terminal }
}
