/**
 * Route matcher for /lectures/:id
 * Matches patterns like:
 * - /lectures/123
 * - /es/lectures/456
 * - /fr/lectures/abc-def
 */
export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Match /lectures/:id or /:locale/lectures/:id
  const match =
    urlPathname.match(/^\/lectures\/([^/]+)\/?$/) || // /lectures/123
    urlPathname.match(/^\/[a-z]{2}\/lectures\/([^/]+)\/?$/) // /es/lectures/123

  if (match) {
    return {
      routeParams: {
        id: match[1],
      },
    }
  }

  return false
}
