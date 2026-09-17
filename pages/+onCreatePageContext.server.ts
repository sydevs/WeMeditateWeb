/**
 * Guarantees `pageContext.locale` on the error page.
 *
 * A thrown `render(<status>)` forks the **pre-routing** pageContext and calls
 * the render directly, so `+onBeforeRoute` never runs for that render and its
 * `locale` is missing. Vike runs this hook on that fork too, before `data()`
 * and `+onBeforeRender`. Without it a 404 under `/fa/…` loses `<html lang>`,
 * flips to `dir="ltr"`, and reads the translations global with no `locale` —
 * which then caches in KV under a key every locale shares.
 *
 * ⚠ Derive from `urlOriginal`, never `urlParsed`. On the nominal path
 * `+onBeforeRoute` has already stripped the prefix, so `urlParsed.pathname`
 * would report `en` for every localized page.
 *
 * `.server.ts` on purpose: Vike re-runs `+onBeforeRoute` in the browser on
 * hydration and on every client-side navigation, so the client already has
 * the locale and a second writer there would be dead weight.
 *
 * https://vike.dev/onCreatePageContext
 */

import type { PageContextServer } from 'vike/types'
import { localeFromPath } from '../lib/urls'

export function onCreatePageContext(pageContext: PageContextServer) {
  // `+onBeforeRoute` stays the single writer wherever routing ran.
  if (pageContext.locale) return

  const { pathname } = new URL(pageContext.urlOriginal, 'http://localhost')

  pageContext.locale = localeFromPath(pathname).locale
}
