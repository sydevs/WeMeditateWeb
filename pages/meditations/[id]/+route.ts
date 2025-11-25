/**
 * Route matcher for /meditations/:id
 * Matches patterns like:
 * - /meditations/123
 * - /es/meditations/456
 * - /fr/meditations/abc-def
 */
export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Match /meditations/:id or /:locale/meditations/:id
  const match =
    urlPathname.match(/^\/meditations\/([^/]+)\/?$/) || // /meditations/123
    urlPathname.match(/^\/[a-z]{2}\/meditations\/([^/]+)\/?$/) // /es/meditations/123

  if (match) {
    return {
      routeParams: {
        id: match[1],
      },
    }
  }

  return false
}
