/**
 * Server-side pre-resolution for `content-index` blocks.
 *
 * A `content-index` block carries a CMS-computed virtual `apiEndpoint` (path +
 * filters + limit) describing the live list it should show. The endpoint can't
 * be fetched verbatim by an API client — collection reads require a `select`,
 * and the lectures `/for-audience` endpoint needs runtime audience context — so
 * here we take the computed endpoint, append the `select`/`locale`/`depth` the
 * backend requires, fetch it (cached), and attach the resulting cards to the
 * block so the renderer can display them synchronously during SSR.
 *
 * Anything we can't resolve (lectures without audiences, a failed fetch)
 * degrades to an empty list — the block renders nothing rather than breaking.
 */

import * as Sentry from '@sentry/react'
import { getCmsContext } from './cms-context'
import { withCache, generateCacheKey, CacheTTL } from './kv-cache'
import type { Audience } from './payload-types'
import type { Locale } from './cms-types'
import {
  contentIndexCard,
  contentIndexTrack,
  meditationCardsFromUserChoices,
  type ContentIndexBlockFields,
  type ResolvedCardItem,
} from '../lib/cms-blocks'
import { audienceIdList } from './cms-client'
// Type-only import (erased at build): the songs index resolves to MusicLibrary tracks.
import type { Track } from '../components/molecules/AudioPlayer/types'

/**
 * Per-type query fragments appended to the CMS-computed endpoint:
 * - `select` is mandatory — the backend rejects API-client reads without it.
 * - `populate` returns the fields of related docs a card/track needs (song
 *   album credit + artwork + tags, lecture user-choice titles).
 * - `depth` reaches those relations (songs need 2 for album → artwork).
 */
const QUERY_BY_TYPE: Record<
  ContentIndexBlockFields['type'],
  { select: string; populate?: string; depth: number }
> = {
  pages: {
    select: 'select[title]=true&select[slug]=true&select[meta]=true&select[tags]=true',
    depth: 1,
  },
  // A `meditations` block resolves to user-choice *categories* (a duration/mood
  // picker), not meditation docs. Select each category's title (the filter-pill
  // label) and its four time-of-day meditation slots, then populate those
  // meditations (title/label/thumbnail/duration) and their thumbnail images
  // (url needs `filename` — the upload virtual gotcha). depth=2 reaches
  // category → meditation → image. See `meditationCardsFromUserChoices`.
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
    // A Song is an upload: `url`/`thumbnailURL` are virtual fields the upload
    // afterRead hook derives from `filename`, so `filename` MUST be selected or
    // they come back null — dropping every track (empty MusicLibrary). Same for
    // related image uploads: `populate[images][filename]` lets the album
    // artwork's url compute (url-only populate would return null).
    select:
      'select[title]=true&select[album]=true&select[url]=true&select[tags]=true&select[thumbnailURL]=true&select[filename]=true',
    populate:
      'populate[albums][artist]=true&populate[albums][artistUrl]=true&populate[albums][artwork]=true&populate[song-tags][slug]=true&populate[images][url]=true&populate[images][filename]=true',
    depth: 2,
  },
}

interface ResolveOptions {
  locale?: Locale
  /** Bypass the KV cache (live preview). */
  preview?: boolean
  /** The site's fixed audiences (WmWebConfig.audiences), passed to the lectures
   * `/for-audience` feed so it resolves server-side. */
  audiences?: (number | Audience)[]
}

/**
 * Drop every `key=…` param from a path+query string. The CMS-computed endpoint
 * sometimes bakes in its own `depth` (e.g. the meditations user-choices feed);
 * our per-type `depth` must be the only one, since duplicate `depth` params
 * parse to an array and the backend 400s ("populate required when depth > 1").
 */
function stripQueryParam(endpoint: string, key: string): string {
  const [path, query = ''] = endpoint.split('?')
  const kept = query.split('&').filter((part) => part !== '' && part.split('=')[0] !== key)

  return kept.length > 0 ? `${path}?${kept.join('&')}` : path
}

/**
 * Cache key for a content-index resolve. Audience ids are folded in for lectures
 * so a WmWebConfig audience change doesn't serve a stale `/for-audience` list.
 */
function contentIndexCacheKey(fields: ContentIndexBlockFields, options: ResolveOptions): string {
  return generateCacheKey('content-index', {
    endpoint: fields.apiEndpoint ?? undefined,
    // Fold in the type so two blocks sharing an endpoint+locale can't collide
    // and return the wrong shape from cache (a songs Track[] vs a card list).
    type: fields.type,
    locale: options.locale,
    audiences: fields.type === 'lectures' ? audienceIdList(options.audiences) : undefined,
  })
}

/**
 * Fetch the live list for a content-index block and return its raw docs, capped
 * at the block `limit`. Degrades to `[]` — warning to Sentry — on any non-200,
 * fetch error, or (for lectures) missing audience context. Shared by the card
 * and track resolvers.
 */
async function fetchContentIndexDocs(
  fields: ContentIndexBlockFields,
  options: ResolveOptions,
): Promise<Record<string, unknown>[]> {
  const { type, limit, apiEndpoint } = fields

  if (!apiEndpoint) {
    return []
  }
  // Lectures resolve via the /for-audience feed keyed on the site's fixed
  // audiences; with none configured the block degrades to empty (not an error).
  const audiences = type === 'lectures' ? audienceIdList(options.audiences) : []

  if (type === 'lectures' && audiences.length === 0) {
    return []
  }
  const { apiKey, baseURL } = getCmsContext()
  const { select, populate, depth } = QUERY_BY_TYPE[type]
  // Strip any depth the CMS baked into the endpoint so ours is the only one.
  const endpoint = stripQueryParam(apiEndpoint, 'depth')
  const separator = endpoint.includes('?') ? '&' : '?'
  const populateParam = populate ? `&${populate}` : ''
  const localeParam = options.locale ? `&locale=${options.locale}` : ''
  const audiencesParam = audiences.length > 0 ? `&audiences=${audiences.join(',')}` : ''
  const url = `${baseURL}${endpoint}${separator}${select}${populateParam}&depth=${depth}${localeParam}${audiencesParam}`

  try {
    const response = await fetch(url, {
      headers: { Authorization: `clients API-Key ${apiKey}` },
    })

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

/**
 * Fetch a content-index block's list (cached) and run `transform` over the raw
 * docs. A `transform` (not a per-doc mapper) because the meditations type is
 * 1-doc→many-cards (a user-choice category expands into its meditations), while
 * cards/tracks are 1:1.
 */
async function resolveContentIndex<T>(
  fields: ContentIndexBlockFields,
  options: ResolveOptions,
  transform: (docs: Record<string, unknown>[]) => T[],
): Promise<T[]> {
  if (!fields.apiEndpoint) {
    return []
  }

  return withCache({
    cacheKey: contentIndexCacheKey(fields, options),
    ttl: CacheTTL.LIST,
    bypassCache: options.preview === true,
    fetchFn: async () => transform(await fetchContentIndexDocs(fields, options)),
  })
}

/** Fetch and map a content-index block's list to cards (pages/lectures/meditations). */
export function resolveContentIndexItems(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<ResolvedCardItem[]> {
  // Meditations resolve to user-choice categories and flatten into a deduped,
  // facet-tagged grid; pages/lectures map one card per doc.
  const transform =
    fields.type === 'meditations'
      ? meditationCardsFromUserChoices
      : (docs: Record<string, unknown>[]) =>
          docs
            .map((doc) => contentIndexCard(doc, fields.type))
            .filter((card): card is ResolvedCardItem => card !== null)

  return resolveContentIndex(fields, options, transform)
}

/** Fetch and map a `songs` content-index block's list to playable tracks. */
export function resolveContentIndexTracks(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<Track[]> {
  return resolveContentIndex(fields, options, (docs) =>
    docs.map(contentIndexTrack).filter((track): track is Track => track !== null),
  )
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

/** Short-circuiting check for at least one `content-index` block (avoids
 * cloning content that has none — the common case). */
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
 * Walk a page's lexical `content`, resolve every `content-index` block's list,
 * and return content with `resolvedItems` attached. The input is left
 * untouched (the cached page object is never mutated); a structural clone is
 * returned only when there is at least one content-index block to resolve.
 */
export async function resolveContentIndexBlocks<T>(
  content: T,
  options: ResolveOptions = {},
): Promise<T> {
  if (!content || typeof content !== 'object' || !hasContentIndexBlock(content)) {
    return content
  }
  // Clone so the (cached) input is never mutated; only reached when there is at
  // least one content-index block to resolve.
  const cloned = structuredClone(content)
  const targets: ContentIndexBlockFields[] = []

  collectContentIndexBlocks(cloned, targets)

  await Promise.all(
    targets.map(async (fields) => {
      // Songs feed the MusicLibrary organism (tracks + playback); every other
      // type feeds a card grid.
      if (fields.type === 'songs') {
        fields.resolvedTracks = await resolveContentIndexTracks(fields, options)
      } else {
        fields.resolvedItems = await resolveContentIndexItems(fields, options)
      }
    }),
  )

  return cloned
}
