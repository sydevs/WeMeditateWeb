/**
 * Server-side pre-resolution for `content-index` blocks.
 *
 * A `content-index` block carries a CMS-computed virtual `apiEndpoint`
 * (path, filters, and limit) that describes the live list it should show.
 * An API client cannot fetch that endpoint as-is: a collection read
 * requires `select`, and the lectures `/for-audience` endpoint needs
 * runtime audience context. So this module takes the computed endpoint,
 * appends the `select`, `locale`, and `depth` the backend requires,
 * fetches it, and attaches the resulting cards to the block. The renderer
 * can then display them synchronously during SSR.
 *
 * Anything this module cannot resolve (lectures with no audiences, a
 * failed fetch) degrades to an empty list. The block then renders nothing,
 * instead of breaking the page.
 */

import * as Sentry from '@sentry/react'
import { cmsFetch } from './cms-fetch'
import type { Audience } from './payload-types'
import type { Locale } from './cms-types'
import {
  contentIndexCard,
  contentIndexTrack,
  meditationCardsFromUserChoices,
  type ContentIndexBlockFields,
  type ResolvedCardItem,
  type PageTagLabels,
} from '../lib/cms-blocks'
import { audienceIdList } from './cms-client'
// Type-only import (erased at build): the songs index resolves to MusicLibrary tracks.
import type { Track } from '../components/molecules/AudioPlayer/types'

/**
 * Per-type query fragments, appended to the CMS-computed endpoint:
 * - `select` is mandatory. The backend rejects an API-client read without it.
 * - `populate` returns the fields of related docs a card or track needs:
 *   song album credit, artwork, and tags, or lecture user-choice titles.
 * - `depth` reaches those relations (songs need depth 2, for album to
 *   artwork).
 */
const QUERY_BY_TYPE: Record<
  ContentIndexBlockFields['type'],
  { select: string; populate?: string; depth: number }
> = {
  pages: {
    select: 'select[title]=true&select[slug]=true&select[meta]=true&select[tags]=true',
    depth: 1,
  },
  // A `meditations` block resolves to user-choice categories (a
  // duration/mood picker), not meditation docs. Select each category's
  // title (the filter-pill label) and its four time-of-day meditation
  // slots. Then populate those meditations (title, label, thumbnail,
  // duration) and their thumbnail images. `url` needs `filename` too: the
  // upload virtual-field gotcha. depth 2 reaches category, then meditation,
  // then image. See `meditationCardsFromUserChoices`.
  meditations: {
    select:
      'select[title]=true&select[morningMeditation]=true&select[afternoonMeditation]=true&select[eveningMeditation]=true&select[nightMeditation]=true',
    populate:
      'populate[meditations][title]=true&populate[meditations][label]=true&populate[meditations][thumbnail]=true&populate[meditations][duration]=true&populate[meditations][durationMinutes]=true&populate[images][url]=true&populate[images][filename]=true&populate[images][width]=true&populate[images][height]=true',
    depth: 2,
  },
  lectures: {
    select: 'select[title]=true&select[thumbnail]=true&select[userChoices]=true',
    populate: 'populate[user-choices][title]=true',
    depth: 1,
  },
  songs: {
    // A Song is an upload. `url` and `thumbnailURL` are virtual fields the
    // upload afterRead hook derives from `filename`. Select `filename`, or
    // both fields return null and every track drops (an empty
    // MusicLibrary). The same applies to related image uploads:
    // `populate[images][filename]` lets the album artwork's url compute. A
    // url-only populate returns null.
    select:
      'select[title]=true&select[album]=true&select[url]=true&select[tags]=true&select[thumbnailURL]=true&select[filename]=true',
    populate:
      // `song-tags[title]` is what the filter pills show. Without it the
      // label had to be title-cased from the slug, which was English-only.
      'populate[albums][artist]=true&populate[albums][artistUrl]=true&populate[albums][artwork]=true&populate[song-tags][slug]=true&populate[song-tags][title]=true&populate[images][url]=true&populate[images][filename]=true',
    depth: 2,
  },
}

interface ResolveOptions {
  locale?: Locale
  /** The site's fixed audiences (WmWebConfig.audiences), passed to the lectures
   * `/for-audience` feed so it resolves server-side. */
  audiences?: (number | Audience)[]
  /**
   * Visible labels for the page-tag facets, from the CMS
   * (`article.general.tag_*`). `lib/cms-blocks.ts` stays free of the
   * translations layer: it takes the resolved map, not the accessor.
   */
  pageTagLabels?: PageTagLabels
}

/**
 * Drops every `key=…` param from a path-and-query string. The
 * CMS-computed endpoint sometimes bakes in its own `depth` (for example,
 * the meditations user-choices feed). The per-type `depth` here must be
 * the only one: a duplicate `depth` param parses to an array, and the
 * backend then 400s ("populate required when depth > 1").
 */
function stripQueryParam(endpoint: string, key: string): string {
  const [path, query = ''] = endpoint.split('?')
  const kept = query.split('&').filter((part) => part !== '' && part.split('=')[0] !== key)

  return kept.length > 0 ? `${path}?${kept.join('&')}` : path
}

/**
 * Gets the live list for a content-index block, and returns its raw docs,
 * capped at the block `limit`. Degrades to `[]`, with a Sentry warning, on
 * any non-200, fetch error, or (for lectures) missing audience context.
 * Shared by the card and track resolvers.
 */
async function fetchContentIndexDocs(
  fields: ContentIndexBlockFields,
  options: ResolveOptions,
): Promise<Record<string, unknown>[]> {
  const { type, limit, apiEndpoint } = fields

  if (!apiEndpoint) {
    return []
  }
  // Lectures resolve through the /for-audience feed, keyed on the site's
  // fixed audiences. With none configured, the block degrades to empty.
  // This is not an error.
  const audiences = type === 'lectures' ? audienceIdList(options.audiences) : []

  if (type === 'lectures' && audiences.length === 0) {
    return []
  }
  const { select, populate, depth } = QUERY_BY_TYPE[type]
  // Strip any depth the CMS baked into the endpoint so ours is the only one.
  const endpoint = stripQueryParam(apiEndpoint, 'depth')
  const separator = endpoint.includes('?') ? '&' : '?'
  const populateParam = populate ? `&${populate}` : ''
  const localeParam = options.locale ? `&locale=${options.locale}` : ''
  const audiencesParam = audiences.length > 0 ? `&audiences=${audiences.join(',')}` : ''
  const path = `${endpoint}${separator}${select}${populateParam}&depth=${depth}${localeParam}${audiencesParam}`

  try {
    const response = await cmsFetch(path)

    if (!response.ok) {
      Sentry.captureMessage('content-index endpoint not resolvable', {
        level: 'warning',
        tags: { source: 'fetchContentIndexDocs' },
        extra: { type, status: response.status },
      })

      return []
    }
    const json = (await response.json()) as { docs?: Record<string, unknown>[] }
    const docs = json.docs ?? []
    const cap = typeof limit === 'number' ? limit : docs.length

    return docs.slice(0, cap)
  } catch (error) {
    Sentry.captureMessage('content-index fetch failed', {
      level: 'warning',
      tags: { source: 'fetchContentIndexDocs' },
      extra: { type, error: error instanceof Error ? error.message : String(error) },
    })

    return []
  }
}

/** Gets and maps a content-index block's list to cards (pages, lectures, meditations). */
export async function resolveContentIndexItems(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<ResolvedCardItem[]> {
  const docs = await fetchContentIndexDocs(fields, options)

  // Meditations resolve to user-choice categories, then flatten into a
  // deduped, facet-tagged grid. Pages and lectures map one card per doc.
  if (fields.type === 'meditations') {
    return meditationCardsFromUserChoices(docs)
  }

  return docs
    .map((doc) => contentIndexCard(doc, fields.type, options.pageTagLabels))
    .filter((card): card is ResolvedCardItem => card !== null)
}

/** Gets and maps a `songs` content-index block's list to playable tracks. */
export async function resolveContentIndexTracks(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<Track[]> {
  const docs = await fetchContentIndexDocs(fields, options)

  return docs.map(contentIndexTrack).filter((track): track is Track => track !== null)
}

/** Recursively collect every `content-index` block's `fields` object. */
function collectContentIndexBlocks(node: unknown, out: ContentIndexBlockFields[]): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectContentIndexBlocks(child, out)
    }

    return
  }
  if (node && typeof node === 'object') {
    const candidate = node as { type?: unknown; fields?: { blockType?: unknown } }

    if (candidate.type === 'block' && candidate.fields?.blockType === 'content-index') {
      out.push(candidate.fields as ContentIndexBlockFields)
    }
    for (const value of Object.values(node)) {
      collectContentIndexBlocks(value, out)
    }
  }
}

/** Checks for at least one `content-index` block, and stops at the first
 * match. Avoids cloning content that has none, the common case. */
function hasContentIndexBlock(node: unknown): boolean {
  if (Array.isArray(node)) {
    return node.some(hasContentIndexBlock)
  }
  if (node && typeof node === 'object') {
    const candidate = node as { type?: unknown; fields?: { blockType?: unknown } }

    if (candidate.type === 'block' && candidate.fields?.blockType === 'content-index') {
      return true
    }

    return Object.values(node).some(hasContentIndexBlock)
  }

  return false
}

/**
 * Walks a page's lexical `content`, resolves every `content-index` block's
 * list, and returns content with `resolvedItems` attached. The input stays
 * untouched: this function never mutates the page object it is handed. It
 * returns a structural clone only when there is at least one
 * content-index block to resolve.
 */
export async function resolveContentIndexBlocks<T>(
  content: T,
  options: ResolveOptions = {},
): Promise<T> {
  if (!content || typeof content !== 'object' || !hasContentIndexBlock(content)) {
    return content
  }
  // Clone so the caller's document is never mutated. Reached only when
  // there is at least one content-index block to resolve.
  const cloned = structuredClone(content)
  const targets: ContentIndexBlockFields[] = []

  collectContentIndexBlocks(cloned, targets)

  await Promise.all(
    targets.map(async (fields) => {
      // Songs feed the MusicLibrary organism (tracks and playback). Every
      // other type feeds a card grid.
      if (fields.type === 'songs') {
        fields.resolvedTracks = await resolveContentIndexTracks(fields, options)
      } else {
        fields.resolvedItems = await resolveContentIndexItems(fields, options)
      }
    }),
  )

  return cloned
}
