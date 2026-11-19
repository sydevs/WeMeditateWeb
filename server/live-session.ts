/**
 * Reports a `countdown` splash whose class the page cannot count down to.
 *
 * What renders is decided by `lib/live-session.ts`, in the converter, so it
 * holds in SSR, in a client-side navigation and in the live preview alike.
 * Reporting is server-only and lives here, because a gap is a SahajCloud data
 * problem an editor has to fix, not something the browser can do anything
 * about — the same split `server/content-index.ts` takes.
 *
 * ⚠ **An unconfigured block is not a gap.** An editor who placed the block and
 * has not picked a class yet is mid-edit; the page already degrades to that
 * language's online classes. Only a class that was picked and has since become
 * unreadable is reported.
 */

import * as Sentry from '@sentry/cloudflare'
import { readSessionClass, type SessionGap } from '../lib/live-session'
import type { Locale } from './sahajcloud-types'

/**
 * One event per distinct gap per isolate, with `console.warn` on every request.
 *
 * ⚠ **Volume, never level.** This read runs per render and nothing here caches
 * it, and a gap stands until an editor fixes the data — so an unbounded
 * `captureMessage` bills the Sentry quota per page view, and a warning nobody
 * can afford to leave on gets turned off. `getWebConfig` bounds its own the
 * same way, for the same reason (`server/AGENTS.md`).
 */
const reportedSessionGaps = new Set<string>()

/** Bounds that memo: one isolate serves every locale, and a gap differs per locale. */
const MAX_REPORTED_SESSION_GAPS = 64

/** What a gap is called in the warning. `absent` never reaches it. */
const GAP_REASONS: Record<Exclude<SessionGap, 'absent'>, string> = {
  unresolved: 'unpublished or removed',
  'not-online': 'no longer an online class',
}

/** Collects every `splash` block at `layout: countdown`, at any depth. */
function collectCountdownBlocks(node: unknown, out: Record<string, unknown>[]): void {
  if (Array.isArray(node)) {
    for (const child of node) collectCountdownBlocks(child, out)

    return
  }

  if (node && typeof node === 'object') {
    const candidate = node as { type?: unknown; fields?: Record<string, unknown> }

    if (
      candidate.type === 'block' &&
      candidate.fields?.blockType === 'splash' &&
      candidate.fields.layout === 'countdown'
    ) {
      out.push(candidate.fields)
    }

    for (const value of Object.values(node)) collectCountdownBlocks(value, out)
  }
}

/** Reports each countdown block whose chosen class can no longer be counted down to. */
export function reportLiveSessionGaps(
  content: unknown,
  options: { slug: string; locale?: Locale },
): void {
  const blocks: Record<string, unknown>[] = []

  collectCountdownBlocks(content, blocks)

  const gaps = blocks
    .map((fields) => readSessionClass(fields.event))
    .filter((source) => source.kind === 'gap' && source.reason !== 'absent')
    .map((source) => GAP_REASONS[(source as { reason: Exclude<SessionGap, 'absent'> }).reason])

  if (gaps.length === 0) return

  console.warn(
    `[liveSession] ${gaps.length} countdown block(s) on "${options.slug}" name a class that is ${gaps.join(', ')}`,
  )

  const signature = `${options.slug}:${gaps.join(',')}`

  if (reportedSessionGaps.has(signature)) return

  if (reportedSessionGaps.size >= MAX_REPORTED_SESSION_GAPS) reportedSessionGaps.clear()

  reportedSessionGaps.add(signature)
  Sentry.captureMessage('A countdown splash names a class it cannot count down to', {
    level: 'warning',
    tags: { source: 'liveSession' },
    extra: { slug: options.slug, gaps, locale: options.locale ?? null },
  })
}
