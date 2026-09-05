import { matchMapRoute } from '../../lib/atlas-route'

/**
 * `/map`, `/map/:region-path`, and `/map/:region-path/:eventId` — every
 * atlas route, server-rendered.
 *
 * A route function, not a filesystem route, because the depth is variable.
 * An atlas route runs from zero segments (the atlas root) to a chain of
 * country, region, city, and venue segments, plus an event id. Vike's
 * filesystem router matches a fixed number of segments, so
 * `pages/map/[...]/+Page.tsx` cannot express this.
 *
 * Matching everything under the prefix is also what `routing=path`
 * requires of the host. The widget navigates with the History API, so an
 * in-page click never reaches this route. A reload, a bookmark, or a
 * shared link does reach it, though, and that URL must return this page.
 */
export default (pageContext: { urlPathname: string }) => matchMapRoute(pageContext.urlPathname)
