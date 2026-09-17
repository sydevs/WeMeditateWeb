import { redirect } from 'vike/abort';
import { modifyUrl } from 'vike/modifyUrl'
import { PageContext } from 'vike/types'
import { DEFAULT_LOCALE } from '../server/cms-types'
import { localeFromPath } from '../lib/urls'

export function onBeforeRoute(pageContext: PageContext) {
  const { locale, urlWithoutLocale } = extractLocale(pageContext.urlParsed)

  return {
    pageContext: {
      // Make locale available as pageContext.locale.
      locale,
      // Vike's router uses pageContext.urlLogical, not pageContext.urlOriginal.
      // pageContext.urlParsed no longer includes the locale.
      urlLogical: urlWithoutLocale,
    },
  }
}

function extractLocale(url: PageContext['urlParsed']) {
  const { href, pathname } = url
  const { locale, pathWithoutLocale, prefixed } = localeFromPath(pathname)

  if (prefixed && locale === DEFAULT_LOCALE) {
    // Preserve query parameters when redirecting
    const redirectUrl = modifyUrl(href, { pathname: pathWithoutLocale })
    throw redirect(redirectUrl, 301)
  }

  const urlWithoutLocale = modifyUrl(href, { pathname: pathWithoutLocale })

  return { locale, urlWithoutLocale }
}
