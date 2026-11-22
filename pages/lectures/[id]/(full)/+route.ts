import { matchDocumentRoute } from '@/lib/urls/document-routes'

/**
 * /lectures/:id — the full page with site chrome. A real /:locale prefix
 * is stripped by +onBeforeRoute before this runs. The id is a single path segment, so this never matches the
 * sibling /lectures/:id/embed route.
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('lectures', pageContext.urlPathname)
