/**
 * The `title` and `description` vike-react settings, declared once for the
 * whole site in `pages/+config.ts`.
 *
 * ⚠ **A separate module from `lib/head.tsx` because vike requires it.** An
 * import in a `+config.ts` is a pointer import, so vike loads the file behind
 * each setting in that setting's own environment — and `title` runs on the
 * server and in the browser while a `Head` component runs on the server
 * alone. One file defining both is `[Wrong Usage] defines the value of
 * configs living in different environments`, and the dev server refuses to
 * render. See https://vike.dev/config#pointer-imports
 *
 * Which is also why this file holds no JSX and imports no renderer: it is
 * the half that ships to the browser.
 */

import type { PageContext } from 'vike/types'
import { pageContextT } from './i18n'
import type { SeoDocument } from './head'

/**
 * The {@link SeoDocument} a route's `+data.ts` built, or null.
 *
 * Null for every route that publishes no URL: an `embed` route, the error
 * page, and anything rendered outside a Vike app.
 */
export function seoDocument(data: unknown): SeoDocument | null {
  const { seo } = (data ?? {}) as { seo?: SeoDocument }

  return seo ?? null
}

/**
 * `<title>`, which vike-react also emits as `og:title`.
 *
 * A route with no document of its own falls back to the site's own name, in
 * the locale of the URL. The error page takes that fallback; each embed route
 * names itself in its own `+config.ts`.
 */
export function contentTitle(pageContext: PageContext): string {
  return (
    seoDocument(pageContext.data)?.title ?? pageContextT(pageContext)('common.general.site_title')
  )
}

/** `description` and `og:description`, on the same terms as {@link contentTitle}. */
export function contentDescription(pageContext: PageContext): string {
  return (
    seoDocument(pageContext.data)?.description ??
    pageContextT(pageContext)('common.general.site_description')
  )
}
