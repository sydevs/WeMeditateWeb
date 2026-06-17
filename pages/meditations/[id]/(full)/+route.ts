import { matchDocumentRoute } from '../../../../lib/cms-routes'

/**
 * /meditations/:id — the full page with site chrome (+ optional /:locale prefix).
 * The id is a single path segment, so this never matches the sibling
 * /meditations/:id/embed route.
 */
export default (pageContext: { urlPathname: string }) =>
  matchDocumentRoute('meditations', pageContext.urlPathname)
