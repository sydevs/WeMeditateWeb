/**
 * Route matcher for /l/:id (embed route)
 * Matches patterns like:
 * - /l/123
 * - /es/l/456
 * - /fr/l/abc-def
 *
 * This route is designed for embedding in iframes
 */
export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Match /l/:id or /:locale/l/:id
  const match =
    urlPathname.match(/^\/l\/([^/]+)\/?$/) || // /l/123
    urlPathname.match(/^\/[a-z]{2}\/l\/([^/]+)\/?$/) // /es/l/123

  if (match) {
    return {
      routeParams: {
        id: match[1],
      },
    }
  }

  return false
}
