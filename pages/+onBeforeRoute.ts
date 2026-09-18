import { redirect } from 'vike/abort';
import { modifyUrl } from 'vike/modifyUrl'
import { PageContext } from 'vike/types'
import { DEFAULT_LOCALE } from '../server/cms-types'
import { isIndexPath, localeFromPath, localePath, normalizeContentPath } from '../lib/urls'

export function onBeforeRoute(pageContext: PageContext) {
  const { href, pathname } = pageContext.urlParsed
  const { locale, pathWithoutLocale, prefixed } = localeFromPath(pathname)

  // A redirect target is a URL, never a spelling only the router uses:
  // `normalizeContentPath` undoes the `/index` below, so `/en` lands on the
  // home page instead of its 200 duplicate. `modifyUrl` rebuilds the origin
  // onto the path and carries the query across.
  if (prefixed && locale === DEFAULT_LOCALE) {
    throw redirect(modifyUrl(href, { pathname: normalizeContentPath(pathWithoutLocale) }), 301)
  }

  // `localeFromPath` gives a bare locale root that same `/index` spelling, so
  // only the requested path says whether the browser asked for it by name.
  const requestedPath = prefixed ? pathname.slice(locale.length + 1) : pathname

  if (isIndexPath(requestedPath)) {
    throw redirect(modifyUrl(href, { pathname: localePath(locale, '/') }), 301)
  }

  return {
    pageContext: {
      // Make locale available as pageContext.locale.
      locale,
      // Vike's router uses pageContext.urlLogical, not pageContext.urlOriginal.
      // pageContext.urlParsed no longer includes the locale.
      urlLogical: modifyUrl(href, { pathname: pathWithoutLocale }),
    },
  }
}
