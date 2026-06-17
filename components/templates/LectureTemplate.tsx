/**
 * LectureTemplate - Template for rendering a lecture.
 *
 * Used by both the lecture routes (/lectures/:id, /lectures/:id/embed) and the live-preview
 * route so rendering stays consistent. Following Atomic Design, templates
 * represent page-level layout structures.
 *
 * Consumes a normalized `ResolvedLecture` (see lib/lecture-shape.ts), so it never
 * branches on full vs clip: a clip already carries its inherited HLS source and
 * its `[startTime, stopTime]` playback window.
 *
 * @example
 * <LectureTemplate lecture={resolvedLecture} locale="en" />
 */

import type { ResolvedLecture } from '../../server/cms-types'
import { EmbedButton, VideoPlayer } from '../molecules'
import { Badge, PageTitle } from '../atoms'

export interface LecturePlayerProps {
  /** Normalized lecture view model (full or clip). */
  lecture: ResolvedLecture
  /** Current locale — selects which subtitle track is the default/active one. */
  locale?: string
  className?: string
}

/**
 * The bare lecture video player: maps a `ResolvedLecture` to the shared
 * VideoPlayer (HLS, clip window, per-locale subtitles, poster) and degrades to a
 * short message when no HLS source resolves. Rendered standalone by the embed
 * route (`/lectures/:id/embed`) and wrapped with a title + duration by LectureTemplate, so
 * the player wiring stays identical in both.
 */
export function LecturePlayer({ lecture, locale, className }: LecturePlayerProps) {
  if (!lecture.hlsUrl) {
    return (
      <p className="p-6 text-center text-gray-500">
        This lecture is missing a playable video source.
      </p>
    )
  }

  return (
    <VideoPlayer
      autoLoad
      className={className}
      defaultSubtitleLang={locale}
      hlsUrl={lecture.hlsUrl}
      poster={lecture.thumbnailUrl ?? undefined}
      startTime={lecture.startTime}
      stopTime={lecture.stopTime}
      subtitleTracks={lecture.subtitles}
      title={lecture.title ?? undefined}
    />
  )
}

export interface LectureTemplateProps {
  /** Normalized lecture view model (full or clip). */
  lecture: ResolvedLecture
  /** Current locale — selects which subtitle track is the default/active one. */
  locale?: string
  /**
   * Whether to show the Embed button (copy an iframe snippet for this lecture).
   * @default true
   */
  showEmbedButton?: boolean
}

/** Format a length in seconds as a duration label ("40 sec" / "20 min"). */
function formatLength(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))

  return total < 60 ? `${total} sec` : `${Math.floor(total / 60)} min`
}

export function LectureTemplate({ lecture, locale, showEmbedButton = true }: LectureTemplateProps) {
  // A clip shows its playable window length; a full lecture shows the whole
  // source duration.
  const windowSeconds =
    lecture.startTime != null && lecture.stopTime != null && lecture.stopTime > lecture.startTime
      ? lecture.stopTime - lecture.startTime
      : null
  const displaySeconds = windowSeconds ?? lecture.duration ?? 0

  // A lecture with no resolvable HLS source can't render a player (e.g. a clip
  // whose parent metadata hasn't synced yet) — degrade gracefully.
  if (!lecture.hlsUrl) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">This lecture is missing a playable video source.</p>
        </div>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto">
      {lecture.title ? <PageTitle title={lecture.title} /> : null}

      <LecturePlayer className="mb-4" lecture={lecture} locale={locale} />

      <div className="flex items-center gap-3">
        {displaySeconds > 0 ? (
          <Badge color="primary" shape="circular">
            {formatLength(displaySeconds)}
          </Badge>
        ) : null}
        {showEmbedButton ? (
          <EmbedButton
            className="ml-auto"
            embedPath={`/lectures/${lecture.id}/embed`}
            locale={locale}
            title={lecture.title ?? undefined}
          />
        ) : null}
      </div>
    </article>
  )
}
