import { matchDocumentRoute } from '../../../../lib/document-routes'

/**
 * /lectures/:id/embed — the bare iframe player. A real /:locale prefix is
 * stripped by +onBeforeRoute before this runs. Sets no Layout, so it inherits only the global LayoutRoot (no
 * site chrome).
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('lectures', pageContext.urlPathname, { embed: true })
