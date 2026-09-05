import { matchDocumentRoute } from '../../../../lib/cms-routes'

/**
 * /meditations/:id/embed — the bare iframe player (and an optional
 * /:locale prefix). Sets no Layout, so it inherits only the global
 * LayoutRoot (no site chrome).
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('meditations', pageContext.urlPathname, { embed: true })
