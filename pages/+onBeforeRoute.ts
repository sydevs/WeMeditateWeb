import { redirect } from 'vike/abort';
import { modifyUrl } from 'vike/modifyUrl'
import { PageContext } from 'vike/types'
import { isLocale } from '../server/cms-types'

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

  // A segment shaped like a locale but not one the CMS defines is a normal
  // path segment, not a locale. `/status/` must reach the Pages route, not
  // become locale `st`. An unknown code then 404s naturally, through the
  // route it really matched.
  if (match && isLocale(match[1])) {
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
