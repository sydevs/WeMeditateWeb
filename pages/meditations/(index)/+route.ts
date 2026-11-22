import { matchMeditationsIndexRoute } from '@/lib/urls/document-routes'

/**
 * /meditations — the list of the meditations the mood finder offers. The
 * sibling /meditations/:id route takes anything under it, so this matches the
 * bare segment alone.
 */
export default (pageContext: { urlPathname: string }) =>
  matchMeditationsIndexRoute(pageContext.urlPathname)
