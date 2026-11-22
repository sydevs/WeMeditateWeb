import { matchDocumentRoute } from '@/lib/urls/document-routes'

/**
 * /meditations/:id — the full page with site chrome. A real /:locale
 * prefix is stripped by +onBeforeRoute before this runs. The id is a single path segment, so this never matches
 * the sibling /meditations/:id/embed route.
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('meditations', pageContext.urlPathname)
