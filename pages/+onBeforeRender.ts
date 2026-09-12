/**
 * Puts the locale's UI strings on `pageContext`, for every route.
 *
 * Server-only by its `.ts` extension under `pages/` — Vike never bundles
 * `+onBeforeRender` into the client. `passToClient` in `+config.ts` carries
 * the result into the browser, so `useT()` resolves the same strings during
 * hydration.
 *
 * This hook never throws. Vike runs it for `_error` too, and an error page
 * that cannot render its own error message is a blank screen. The data
 * function runs first, so on a normal page the globals are already loaded
 * and this is a memo read, not a second fetch.
 */

import type { PageContextServer } from 'vike/types'
import { loadSiteContext } from '../server/site-context'
import { EN_TRANSLATIONS } from '../lib/i18n'

export async function onBeforeRender(pageContext: PageContextServer) {
  try {
    const { translations } = await loadSiteContext(pageContext)

    return { pageContext: { translations } }
  } catch {
    // Includes the `render(404)` a disabled locale throws: by the time the
    // error page renders, it still needs strings. The data function already
    // turned that abort into the 404 response.
    return { pageContext: { translations: EN_TRANSLATIONS } }
  }
}
