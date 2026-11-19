import { matchMeditationsIndexRoute } from '../../../lib/document-routes'

/**
 * /meditations — the list of the meditations the mood finder offers, with an
 * optional /:locale prefix. The sibling /meditations/:id route takes anything
 * under it, so this matches the bare segment alone.
 */
export default (pageContext: { urlPathname: string }) =>
  matchMeditationsIndexRoute(pageContext.urlPathname)
