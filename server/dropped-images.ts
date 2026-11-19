/**
 * The images a page's body references but cannot draw.
 *
 * An unpublished, trashed or deleted image comes back from a page read as a
 * bare id. The `upload` and `image-gallery` converters drop such a reference
 * rather than draw an empty box, so without this the gap is invisible to the
 * editor who could fix it (server/AGENTS.md).
 */

import * as Sentry from '@sentry/cloudflare'
import { populatedImage } from '../lib/content-blocks'
import { isPopulated } from '../lib/payload-relationships'

/** One image reference the renderers drop. */
export interface DroppedImage {
  /** The Lexical node that holds the reference. */
  node: 'upload' | 'image-gallery'
  /**
   * The referenced image's id, where the read still names one. A deleted
   * image comes back as `null` at depth, so a page can name only the gap.
   */
  id: number | string | null
}

/** A Lexical node, as far as finding image references cares. */
interface ContentNode {
  type?: unknown
  relationTo?: unknown
  value?: unknown
  fields?: { blockType?: unknown; items?: unknown }
  children?: unknown
}

function refId(ref: unknown): number | string | null {
  if (typeof ref === 'number' || typeof ref === 'string') {
    return ref
  }
  if (
    isPopulated<{ id?: unknown }>(ref) &&
    (typeof ref.id === 'number' || typeof ref.id === 'string')
  ) {
    return ref.id
  }

  return null
}

/**
 * Every image reference in a page's `content` that `populatedImage` rejects —
 * the same test both converters apply, so what this reports is exactly what
 * the page leaves out.
 */
export function droppedImages(content: unknown): DroppedImage[] {
  const dropped: DroppedImage[] = []

  const visit = (node: unknown): void => {
    if (!isPopulated<ContentNode>(node)) {
      return
    }
    if (node.type === 'upload' && node.relationTo === 'images' && !populatedImage(node.value)) {
      dropped.push({ node: 'upload', id: refId(node.value) })
    }
    if (node.type === 'block' && node.fields?.blockType === 'image-gallery') {
      const items = Array.isArray(node.fields.items) ? node.fields.items : []

      for (const item of items) {
        if (!populatedImage(item)) {
          dropped.push({ node: 'image-gallery', id: refId(item) })
        }
      }
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(visit)
    }
  }

  visit(isPopulated<{ root?: unknown }>(content) ? content.root : undefined)

  return dropped
}

/**
 * The gaps this isolate has already sent. A gap stands until an editor fixes
 * it and the read runs per render, so an event per render would bill the
 * Sentry quota per page view; an isolate is reused across requests and
 * dropped without notice, which re-reports a live gap often enough.
 */
const reportedGaps = new Set<string>()

/** Past this the memo is emptied rather than pruned: re-reporting is the harmless direction. */
const MAX_REPORTED_GAPS = 64

/**
 * Logs every image a page drops, on every render, and sends a Sentry warning
 * once per distinct gap (page, locale and dropped refs) per isolate.
 */
export function reportDroppedImages(
  page: { slug?: string | null; content?: unknown },
  locale: string,
): void {
  const dropped = droppedImages(page.content)

  if (dropped.length === 0) {
    return
  }
  const refs = dropped.map(({ node, id }) => `${node}:${id ?? 'missing'}`).join(',')

  console.warn(`[SahajCloud] page "${page.slug}" (${locale}) drops unresolved images: ${refs}`)

  // Keyed per locale: a page's content is localized, so each locale's dangling
  // reference is its own fix, and a deleted image reads as `missing` in all.
  const signature = `${page.slug}|${locale}|${refs}`

  if (reportedGaps.has(signature)) {
    return
  }
  if (reportedGaps.size >= MAX_REPORTED_GAPS) reportedGaps.clear()

  reportedGaps.add(signature)
  Sentry.captureMessage('Page content references unpublished or unresolved images', {
    level: 'warning',
    tags: { source: 'getPageBySlug' },
    extra: { slug: page.slug, dropped, locale },
  })
}
