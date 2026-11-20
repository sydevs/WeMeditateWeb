/**
 * Reports a data gap to Sentry once per distinct signature per isolate.
 *
 * ⚠ **The bound is volume, never level.** These gaps are found on reads that
 * run per render, and nothing in this repo caches a read — so an unbounded
 * `captureMessage` bills the Sentry quota per page view, and a warning nobody
 * can afford to leave on gets turned off, which makes the gap invisible again
 * (`server/AGENTS.md`). The caller still logs on every request.
 *
 * A Workers isolate is reused across requests and dropped without notice,
 * which is the bound wanted here: often enough that a gap cannot go
 * unreported, rare enough to cost nothing. Past the cap the set is emptied
 * rather than pruned, because re-reporting a live gap is the harmless
 * direction.
 */

/** One isolate serves every locale, and a gap differs per locale, so this is capped. */
const MAX_SIGNATURES = 64

const seen = new Map<string, Set<string>>()

/**
 * Runs `report` the first time this `source` sees this `signature`.
 *
 * @param source - The reporting site, so two of them cannot collide
 * @param signature - What makes this gap distinct. A changed gap reports again
 */
export function reportOnce(source: string, signature: string, report: () => void): void {
  let signatures = seen.get(source)

  if (!signatures) {
    signatures = new Set()
    seen.set(source, signatures)
  }

  if (signatures.has(signature)) return

  if (signatures.size >= MAX_SIGNATURES) signatures.clear()

  signatures.add(signature)
  report()
}
