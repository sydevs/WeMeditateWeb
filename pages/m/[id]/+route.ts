/**
 * Route matcher for /m/:id (embed route)
 * Matches patterns like:
 * - /m/123
 * - /es/m/456
 * - /fr/m/abc-def
 *
 * This route is designed for embedding in iframes
 */
export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Match /m/:id or /:locale/m/:id
  const match =
    urlPathname.match(/^\/m\/([^/]+)\/?$/) || // /m/123
    urlPathname.match(/^\/[a-z]{2}\/m\/([^/]+)\/?$/) // /es/m/123

  if (match) {
    return {
      routeParams: {
        id: match[1],
      },
    }
  }

  return false
}
