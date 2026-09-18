/**
 * Guarantees `pageContext.locale` on the error page.
 *
 * A thrown `render(<status>)` forks the pre-routing pageContext, so
 * `+onBeforeRoute` never runs for that render and its `locale` is missing.
 * Vike runs this hook on that fork too, before `data()`.
 *
 * ⚠ Derive from `urlOriginal`, never `urlParsed`. On the nominal path
 * `+onBeforeRoute` has already stripped the prefix, so `urlParsed.pathname`
 * would report `en` for every localized page.
 *
 * `.server.ts` on purpose: Vike re-runs `+onBeforeRoute` in the browser on
 * hydration and on every client-side navigation, so the client already has
 * the locale.
 *
 * https://vike.dev/onCreatePageContext
 */

import type { PageContextServer } from 'vike/types'
import { localeFromPath } from '../lib/urls'

export function onCreatePageContext(pageContext: PageContextServer) {
  // `+onBeforeRoute` stays the single writer wherever routing ran.
  if (pageContext.locale) return

  // Vike's own runtime parses `urlOriginal` this way: it may be a path or an
  // absolute URL, depending on the server adapter.
  const { pathname } = new URL(pageContext.urlOriginal, 'http://localhost')

  pageContext.locale = localeFromPath(pathname).locale
}
