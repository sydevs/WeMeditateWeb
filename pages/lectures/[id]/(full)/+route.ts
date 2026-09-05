import { matchDocumentRoute } from '../../../../lib/cms-routes'

/**
 * /lectures/:id — the full page with site chrome (and an optional /:locale
 * prefix). The id is a single path segment, so this never matches the
 * sibling /lectures/:id/embed route.
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('lectures', pageContext.urlPathname)
