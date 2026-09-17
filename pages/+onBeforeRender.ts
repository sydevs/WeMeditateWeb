/**
 * Puts the locale's UI strings on `pageContext`, for every route.
 *
 * Server-only by its `.ts` extension under `pages/` — Vike never bundles
 * `+onBeforeRender` into the client. `passToClient` in `+config.ts` carries
 * the result into the browser, so `useT()` resolves the same strings during
 * hydration.
 *
 * This hook never throws. Vike runs it for `_error` too, and an error page
 * that cannot render its own error message is a blank screen.
 *
 * `data()` runs first, so on a normal page both reads below are memo hits
 * rather than second fetches. That holds only because the memos key on
 * `server/request-memo.ts` — vike hands this hook a different `pageContext`
 * object than it handed `data()`, and keying on the argument missed (#108).
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
    // for a populated config read it never renders.
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
    return {
      pageContext: { translations: EN_TRANSLATIONS, livePreview: toClientState(LIVE_PREVIEW_OFF) },
    }
  }
}
