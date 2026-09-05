import { redirect } from 'vike/abort';
import { modifyUrl } from 'vike/modifyUrl'
import { PageContext } from 'vike/types'

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
  const { href, pathname, searchOriginal } = url

  // Match the locale pattern at the start of the path (for example, /en/, /fr/, /es-MX/)
  const match = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/(.*))?$/);

  let locale = 'en'; // Default locale
  let pathWithoutLocale = pathname === '/' ? '/index' : pathname;

  if (match) {
    locale = match[1];
    pathWithoutLocale = match[2] ? `/${match[2]}` : '/index';

    if (locale == 'en') {
      // Preserve query parameters when redirecting
      const redirectUrl = modifyUrl(href, { pathname: pathWithoutLocale })
      throw redirect(redirectUrl, 301)
    }
  }

  const urlWithoutLocale = modifyUrl(href, { pathname: pathWithoutLocale })

  return { locale, urlWithoutLocale }
}
