/**
 * Server-side pre-resolution for `content-index` blocks.
 *
 * A `content-index` block carries a SahajCloud-computed virtual `apiEndpoint`
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

import * as Sentry from '@sentry/cloudflare'
import { sahajCloudFetch, SahajCloudResponseError } from './sahajcloud/fetch'
import { withRetry } from './error-utils'
import { meditationLibraryFromChoices } from './meditation-library'
import type { Audience } from '@/types/payload/payload-types'
import type { Locale } from '@/types/sahajcloud'
import {
  contentIndexBlocks,
  contentIndexCard,
  contentIndexTrack,
  type ContentIndexBlockFields,
  type ResolvedCardItem,
  type ResolvedMeditationLibrary,
  type PageTagLabels,
} from '@/lib/content/blocks'
import { audienceIdList } from './sahajcloud'
// Type-only import (erased at build): the songs index resolves to MusicLibrary tracks.
import type { Track } from '@/lib/media/audio'

/**
 * Per-type query fragments, appended to the SahajCloud-computed endpoint:
 * - `select` is mandatory. The backend rejects an API-client read without it.
 * - `populate` returns the fields of related docs a card or track needs:
 *   song album credit, artwork, and tags, or lecture user-choice titles.
 * - `depth` reaches those relations (songs need depth 2, for album to
 *   artwork).
 */
const QUERY_BY_TYPE: Partial<
  Record<ContentIndexBlockFields['type'], { select: string; populate?: string; depth: number }>
> = {
  pages: {
    select: 'select[title]=true&select[slug]=true&select[meta]=true&select[tags]=true',
    depth: 1,
  },
  // A `meditations` block resolves to the user choices an editor picked (moods
  // and durations), not to meditation docs. `depth: 0` leaves every slot a bare
  // id on purpose: `server/meditation-library.ts` reads those ids at
  // `locale=all`, where a populated read at the page's locale answers with
  // nothing. `url` needs `filename` too — the upload virtual-field gotcha.
  meditations: {
    select:
      'select[title]=true&select[type]=true&select[timings]=true&select[color]=true&select[url]=true&select[filename]=true&select[morningMeditation]=true&select[afternoonMeditation]=true&select[eveningMeditation]=true',
    depth: 0,
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
      'select[title]=true&select[album]=true&select[url]=true&select[tags]=true&select[duration]=true&select[thumbnailURL]=true&select[filename]=true',
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
   * Visible labels for the page-tag facets, from SahajCloud
   * (`article.general.tag_*`). `lib/content/blocks.ts` stays free of the
   * translations layer: it takes the resolved map, not the accessor.
   */
  pageTagLabels?: PageTagLabels
}

/**
 * Drops every `key=…` param from a path-and-query string. The
 * SahajCloud-computed endpoint sometimes bakes in its own `depth` (for example,
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
 * capped at the block `limit`, with the `totalDocs` the read reported.
 * Degrades to no docs, with a Sentry warning, on any non-200, fetch error, or
 * (for lectures) missing audience context. Shared by every resolver.
 *
 * `totalDocs` is the whole collection the filter matched, before the cap: the
 * meditations resolver reports a block showing fewer choices than the data
 * holds rather than rendering a silently short row.
 */
async function fetchContentIndexDocs(
  fields: ContentIndexBlockFields,
  options: ResolveOptions,
): Promise<{ docs: Record<string, unknown>[]; totalDocs?: number }> {
  const { type, limit, apiEndpoint } = fields

  if (!apiEndpoint) {
    return { docs: [] }
  }
  // Lectures resolve through the /for-audience feed, keyed on the site's
  // fixed audiences. With none configured, the block degrades to empty.
  // This is not an error.
  const audiences = type === 'lectures' ? audienceIdList(options.audiences) : []

  if (type === 'lectures' && audiences.length === 0) {
    return { docs: [] }
  }
  // ⚠ A type this build does not know about must degrade, not throw. The lookup
  // sits above the `try`, and `pages/[slug]/+data.ts` awaits this with no catch,
  // so a block type SahajCloud offers before the site ships support for it would
  // 500 the whole page rather than render one empty region.
  const query = QUERY_BY_TYPE[type]

  if (!query) {
    return { docs: [] }
  }
  const { select, populate, depth } = query
  // Strip any depth SahajCloud baked into the endpoint so ours is the only one.
  const endpoint = stripQueryParam(apiEndpoint, 'depth')
  const separator = endpoint.includes('?') ? '&' : '?'
  const populateParam = populate ? `&${populate}` : ''
  const localeParam = options.locale ? `&locale=${options.locale}` : ''
  const audiencesParam = audiences.length > 0 ? `&audiences=${audiences.join(',')}` : ''
  const path = `${endpoint}${separator}${select}${populateParam}&depth=${depth}${localeParam}${audiencesParam}`

  try {
    // `sahajCloudFetch`, not `sahajCloudFetchOptional`: this endpoint is one SahajCloud computed
    // for the block, so a 404 is a data gap rather than an answer.
    //
    // `withRetry` classifies structurally off the error's own status, so a 5xx
    // and a Cloudflare-origin 520/522/524 retry and a 4xx does not. A retried
    // attempt is a breadcrumb, so a failed read costs the wrapper's one
    // `captureException` plus the degrade below, whatever the attempt count.
    const json = await withRetry(() =>
      sahajCloudFetch<{ docs?: Record<string, unknown>[]; totalDocs?: number }>(
        path,
        `fetchContentIndexDocs(${type})`,
      ),
    )
    const docs = json.docs ?? []
    const cap = typeof limit === 'number' ? limit : docs.length

    return { docs: docs.slice(0, cap), totalDocs: json.totalDocs }
  } catch (error) {
    Sentry.captureMessage('content-index fetch failed', {
      level: 'warning',
      tags: { source: 'fetchContentIndexDocs' },
      extra: {
        type,
        status: error instanceof SahajCloudResponseError ? error.status : undefined,
        error: error instanceof Error ? error.message : String(error),
      },
    })

    return { docs: [] }
  }
}

/** Gets and maps a content-index block's list to cards (pages and lectures). */
export async function resolveContentIndexItems(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<ResolvedCardItem[]> {
  const { docs } = await fetchContentIndexDocs(fields, options)

  return docs
    .map((doc) => contentIndexCard(doc, fields.type, options.pageTagLabels))
    .filter((card): card is ResolvedCardItem => card !== null)
}

/**
 * The choices a `meditations` block offers and the meditations they name.
 *
 * Two reads, deliberately at different locales. The choices come from the
 * block's own computed `apiEndpoint` at the page's locale, where `title` is
 * localized; the meditations come by id at `locale=all`, the only spelling that
 * answers in a non-English locale without dropping a localized slot
 * (`server/meditation-library.ts`).
 */
async function resolveMeditationLibrary(
  fields: ContentIndexBlockFields,
  options: ResolveOptions,
): Promise<ResolvedMeditationLibrary> {
  const { docs, totalDocs } = await fetchContentIndexDocs(fields, options)

  return meditationLibraryFromChoices(docs, { totalDocs })
}

/** Gets and maps a `songs` content-index block's list to playable tracks. */
export async function resolveContentIndexTracks(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<Track[]> {
  const { docs } = await fetchContentIndexDocs(fields, options)

  return docs.map(contentIndexTrack).filter((track): track is Track => track !== null)
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
  // Walked before the clone, so content with no such block — the common
  // case — is never cloned.
  if (!content || typeof content !== 'object' || contentIndexBlocks(content).length === 0) {
    return content
  }
  // Clone so the caller's document is never mutated. Reached only when
  // there is at least one content-index block to resolve.
  const cloned = structuredClone(content)
  const targets = contentIndexBlocks(cloned)

  await Promise.all(
    targets.map(async (fields) => {
      // Songs feed the MusicLibrary organism (tracks and playback). Every
      // other type feeds a card grid.
      if (fields.type === 'songs') {
        fields.resolvedTracks = await resolveContentIndexTracks(fields, options)
      } else if (fields.type === 'meditations') {
        fields.resolvedLibrary = await resolveMeditationLibrary(fields, options)
      } else {
        fields.resolvedItems = await resolveContentIndexItems(fields, options)
      }
    }),
  )

  return cloned
}
