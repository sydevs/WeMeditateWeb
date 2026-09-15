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
import { LIVE_PREVIEW_OFF, loadLivePreview, toClientState } from '../server/live-preview'
import { loadTranslations } from '../server/site-context'
import { EN_TRANSLATIONS } from '../lib/i18n'

export async function onBeforeRender(pageContext: PageContextServer) {
  try {
    // Translations only, never the config. This hook runs for every route,
    // and the embed routes deliberately fetch no config — "there is no nav
    // to populate" — so loading both here would make every iframe embed pay
    // for a populated config read it never renders. On a chromed route the
    // data function has already loaded both, and this is a memo read.
    // Both are memo reads on a normal page: `data()` has already asked for the
    // live-preview verdict and the globals. This hook exists so both reach the
    // browser, where `useT()` and the preview chrome need them during hydration.
    const [translations, livePreview] = await Promise.all([
      loadTranslations(pageContext),
      loadLivePreview(pageContext),
    ])

    // `toClientState`, never the session itself: `passToClient` serialises
    // whatever this returns into the page, and the session carries the token.
    return { pageContext: { translations, livePreview: toClientState(livePreview) } }
  } catch {
    // `loadTranslations` already degrades to the snapshot, so this only
    // catches something unforeseen. An error page that cannot render its
    // own error message is a blank screen.
    return { pageContext: { translations: EN_TRANSLATIONS, livePreview: toClientState(LIVE_PREVIEW_OFF) } }
  }
}
