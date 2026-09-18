import { redirect } from 'vike/abort';
import { modifyUrl } from 'vike/modifyUrl'
import { PageContext } from 'vike/types'
import { DEFAULT_LOCALE } from '../server/cms-types'
import { localeFromPath } from '../lib/urls'

export function onBeforeRoute(pageContext: PageContext) {
  const { href, pathname } = pageContext.urlParsed
  const { locale, pathWithoutLocale, prefixed } = localeFromPath(pathname)

  if (prefixed && locale === DEFAULT_LOCALE) {
    // Preserve query parameters when redirecting
    throw redirect(modifyUrl(href, { pathname: pathWithoutLocale }), 301)
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
