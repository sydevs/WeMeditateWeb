import { matchMapRoute } from '../../lib/atlas-route'

/**
 * `/map`, `/map/:region-path` and `/map/:region-path/:eventId` — every atlas
 * route, server-rendered.
 *
 * A **route function** rather than a filesystem route because the depth is
 * variable: an atlas route runs from zero segments (the atlas root) to a
 * country/region/city/venue chain plus an event id. Vike's filesystem router
 * matches a fixed number of segments, so `pages/map/[...]/+Page.tsx` cannot
 * express this.
 *
 * Matching everything under the prefix is also what `routing=path` requires of
 * the host: the widget navigates with the History API, so an in-page click never
 * reaches us — but a reload, a bookmark or a shared link does, and that URL has
 * to return this page.
 */
export default (pageContext: { urlPathname: string }) => matchMapRoute(pageContext.urlPathname)
