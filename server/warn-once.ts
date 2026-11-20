/**
 * A Sentry warning that reports each distinct gap once per isolate.
 *
 * Two server-side readers need this and neither may do without it: a warning on
 * an uncached SSR read is on the hot path, and the data gaps they find stand
 * until an editor fixes them — so a bare capture bills the quota per page view.
 * `server/AGENTS.md` owns the rule ("lower the volume, never the level").
 *
 * ⚠ **Not in `server/error-utils.ts`**, which `ErrorFallback` imports in the
 * browser and which therefore reaches Sentry through `@sentry/react`. Both
 * callers here are server-only and report through the Worker SDK, as the rest
 * of `server/` does.
 */

import * as Sentry from '@sentry/cloudflare'

/** The default signature cap. A Workers isolate is dropped without notice, which
 * is the bound wanted: often enough that a gap cannot go unreported, rare
 * enough to cost nothing. */
const MAX_SIGNATURES = 64

export function createWarnOnce(source: string, maxSignatures = MAX_SIGNATURES) {
  const reported = new Set<string>()

  return (signature: string, message: string, extra: Record<string, unknown>): void => {
    if (reported.has(signature)) return
    // Emptied rather than pruned past the cap: re-reporting a live gap is the
    // harmless direction.
    if (reported.size >= maxSignatures) reported.clear()

    reported.add(signature)
    Sentry.captureMessage(message, { level: 'warning', tags: { source }, extra })
  }
}
