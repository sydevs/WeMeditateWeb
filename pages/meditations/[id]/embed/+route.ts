import { matchDocumentRoute } from '@/lib/urls/document-routes'

/**
 * /meditations/:id/embed — the bare iframe player. A real /:locale prefix
 * is stripped by +onBeforeRoute before this runs. Sets no Layout, so it inherits only the global
 * LayoutRoot (no site chrome).
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('meditations', pageContext.urlPathname, { embed: true })
