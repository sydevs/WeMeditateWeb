import { matchDocumentRoute } from '../../../../lib/cms-routes'

/**
 * /lectures/:id/embed — the bare iframe player (+ optional /:locale prefix).
 * Sets no Layout, so it inherits only the global LayoutRoot (no site chrome).
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('lectures', pageContext.urlPathname, { embed: true })
