/**
 * Route matcher for pages in default locale (English).
 * Matches: /about, /contact, etc.
 * Does NOT match: / (homepage), /cs/*, /de/*, etc.
 */

export default function route(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext

  // Don't match homepage
  if (urlPathname === '/') {
    return false
  }

  // Don't match locale-prefixed routes (handled by [locale]/[slug])
  if (urlPathname.match(/^\/[a-z]{2}\//)) {
    return false
  }

  // Match single-level paths like /about, /contact
  const match = urlPathname.match(/^\/([^/]+)\/?$/)
  if (match) {
    return {
      routeParams: {
        slug: match[1],
      },
    }
  }

  return false
}
