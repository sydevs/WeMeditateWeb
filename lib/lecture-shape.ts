/**
 * Pure, framework-agnostic normalization for the Lecture content type.
 *
 * A Lecture is either a `full` lecture (carrying its own `metadata`, synced from
 * the Nirmala Vidya API) or a `clip` excerpted from a parent full lecture. Clips
 * have `metadata = null` and must read their playback source (HLS URL,
 * thumbnail, duration, base subtitles) from the parent via `fullLecture`.
 *
 * `resolveLecture` collapses both cases into a single `ResolvedLecture` view
 * model so the template and player never branch on full vs clip. The same
 * function runs server-side (`getLecture`) and client-side (live preview), so it
 * must stay free of server-only dependencies.
 *
 * Mirrors the CMS reference `sy-devs-cms/src/lib/lectures/lectureShape.ts`.
 */

import type { Lecture } from '../server/payload-types'
import { isPopulated, populatedImageUrl } from './cms-relationships'

/** A resolved subtitle track: a locale code and an external WebVTT URL. */
export interface LectureSubtitleTrack {
  locale: string
  url: string
}

/**
 * The JSON `metadata` populated from the Nirmala Vidya API. Stored untyped on
 * the CMS (`metadata` is a generic json field), so it is parsed defensively.
 */
export interface LectureMetadata {
  title?: string
  thumbnailUrl?: string
  hlsUrl?: string
  /** Total source duration, in seconds. */
  duration?: number
  /** Map of locale code → WebVTT URL. */
  subtitles?: Record<string, string>
  lastSyncedAt?: string
}

/**
 * Flat view model the Lecture template and player consume. Derived from a full
 * lecture's own metadata, or a clip's parent metadata, plus the clip's overrides.
 */
export interface ResolvedLecture {
  id: number
  type: 'full' | 'clip'
  title: string | null
  hlsUrl: string | null
  thumbnailUrl: string | null
  /** Total source duration in seconds (the whole lecture, not the clip window). */
  duration: number | null
  /** Clip playback-window start, in seconds (null for full lectures). */
  startTime: number | null
  /** Clip playback-window stop, in seconds (null for full lectures). */
  stopTime: number | null
  /** Merged subtitle tracks: parent API tracks overridden by clip tracks. */
  subtitles: LectureSubtitleTrack[]
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Defensively read the untyped CMS `metadata` json into a `LectureMetadata`. */
export function parseLectureMetadata(value: unknown): LectureMetadata | null {
  if (!isPopulated<Record<string, unknown>>(value) || Array.isArray(value)) {
    return null
  }

  const subtitles: Record<string, string> = {}
  const rawSubtitles = value.subtitles

  if (isPopulated<Record<string, unknown>>(rawSubtitles) && !Array.isArray(rawSubtitles)) {
    for (const [locale, url] of Object.entries(rawSubtitles)) {
      const vttUrl = asString(url)

      if (vttUrl) {
        subtitles[locale] = vttUrl
      }
    }
  }

  return {
    title: asString(value.title),
    thumbnailUrl: asString(value.thumbnailUrl),
    hlsUrl: asString(value.hlsUrl),
    duration: asFiniteNumber(value.duration),
    subtitles,
    lastSyncedAt: asString(value.lastSyncedAt),
  }
}

/**
 * Merge subtitle sources: start from the parent's API subtitle map, then apply
 * per-locale clip overrides — a clip track replaces the parent track for that
 * locale, or adds a new one. Empty URLs are dropped; the result is locale-sorted
 * for deterministic output. Mirrors the CMS reference `mergeSubtitles`.
 */
export function mergeSubtitles(
  parentSubtitles: Record<string, string> | undefined,
  clipOverrides: Lecture['subtitles'],
): LectureSubtitleTrack[] {
  const byLocale = new Map<string, string>()

  for (const [locale, url] of Object.entries(parentSubtitles ?? {})) {
    if (typeof url === 'string' && url.length > 0) {
      byLocale.set(locale, url)
    }
  }

  for (const override of clipOverrides ?? []) {
    if (override && typeof override.url === 'string' && override.url.length > 0) {
      byLocale.set(override.locale, override.url)
    }
  }

  return [...byLocale.entries()]
    .map(([locale, url]) => ({ locale, url }))
    .sort((a, b) => a.locale.localeCompare(b.locale))
}

/**
 * Collapse a raw Lecture (full or clip) into a flat `ResolvedLecture`. For clips,
 * the playback source (HLS, duration, base subtitles, thumbnail fallback) comes
 * from the populated `fullLecture` parent; the clip contributes its window
 * (`startTime`/`stopTime`), its own thumbnail override, and subtitle overrides.
 *
 * If a clip's `fullLecture` is unpopulated (a bare id — e.g. live preview at
 * insufficient depth), the source metadata is simply absent and `hlsUrl` is
 * null; the template degrades to a "no video" state rather than throwing.
 */
export function resolveLecture(lecture: Lecture): ResolvedLecture {
  const isClip = lecture.type === 'clip'
  const parent = isClip && isPopulated<Lecture>(lecture.fullLecture) ? lecture.fullLecture : null

  // Source metadata: the parent's for a clip, the lecture's own for a full lecture.
  const sourceMeta = parseLectureMetadata(isClip ? parent?.metadata : lecture.metadata)

  // Thumbnail: the lecture's own Image override wins, else the API thumbnail.
  const thumbnailUrl = populatedImageUrl(lecture.thumbnail) ?? sourceMeta?.thumbnailUrl ?? null

  return {
    id: lecture.id,
    type: lecture.type,
    title: lecture.title ?? sourceMeta?.title ?? null,
    hlsUrl: sourceMeta?.hlsUrl ?? null,
    thumbnailUrl,
    duration: sourceMeta?.duration ?? null,
    startTime: typeof lecture.startTime === 'number' ? lecture.startTime : null,
    stopTime: typeof lecture.stopTime === 'number' ? lecture.stopTime : null,
    subtitles: mergeSubtitles(sourceMeta?.subtitles, lecture.subtitles),
  }
}
