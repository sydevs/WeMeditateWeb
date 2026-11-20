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
import { populatedImage } from '../lib/content-blocks'
import { readSessionClass, type SessionGap } from '../lib/live-session'
import { reportOnce } from './report-once'
import type { Locale } from './sahajcloud-types'

/** What a gap is called in the warning. `absent` never reaches it. */
const GAP_REASONS: Record<Exclude<SessionGap, 'absent'>, string> = {
  unresolved: 'unpublished or removed',
  'not-online': 'no longer an online class',
}

/**
 * The `splash` blocks at `layout: countdown`, read off the root's own children.
 *
 * One level, not a walk: `pageBlocks` is attached to one rich-text field
 * upstream and no page block carries a rich-text field of its own, so every
 * block is a child of the root. A deep walk would recurse through every text
 * node and every populated relationship of a depth-3 document, on the TTFB
 * path, for every page on the site.
 */
function countdownBlocks(content: unknown): Record<string, unknown>[] {
  const root = (content as { root?: { children?: unknown[] } } | null)?.root

  return (
    (root?.children ?? [])
      .map((node) => (node as { type?: unknown; fields?: Record<string, unknown> }) ?? {})
      .filter((node) => node.type === 'block' && node.fields?.blockType === 'splash')
      .filter((node) => node.fields?.layout === 'countdown')
      .map((node) => node.fields as Record<string, unknown>)
      // A splash with no populated background image renders nothing at all, so
      // its class is not on the page to be a gap. The converter's own guard.
      .filter((fields) => populatedImage((fields.images as unknown[] | undefined)?.[0]) !== null)
  )
}

/** Reports each countdown block whose chosen class can no longer be counted down to. */
export function reportLiveSessionGaps(
  content: unknown,
  options: { slug: string; locale?: Locale },
): void {
  const gaps = countdownBlocks(content)
    .map((fields) => readSessionClass(fields.event))
    .flatMap((source) =>
      source.kind === 'gap' && source.reason !== 'absent' ? [GAP_REASONS[source.reason]] : [],
    )

  if (gaps.length === 0) return

  console.warn(
    `[liveSession] ${gaps.length} countdown block(s) on "${options.slug}" name a class that is ${gaps.join(', ')}`,
  )

  reportOnce('liveSession', `${options.slug}:${gaps.join(',')}`, () => {
    Sentry.captureMessage('A countdown splash names a class it cannot count down to', {
      level: 'warning',
      tags: { source: 'liveSession' },
      // The locale of the render that first saw this gap in this isolate, not
      // the only one affected.
      extra: { slug: options.slug, gaps, locale: options.locale ?? null },
    })
  })
}
