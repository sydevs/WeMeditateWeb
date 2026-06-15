/**
 * LectureTemplate - Template for rendering a lecture.
 *
 * Used by both the lecture routes (/lectures/:id, /l/:id) and the live-preview
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
import { VideoPlayer } from '../molecules'
import { Duration } from '../atoms'

export interface LectureTemplateProps {
  /** Normalized lecture view model (full or clip). */
  lecture: ResolvedLecture
  /** Current locale — selects which subtitle track is the default/active one. */
  locale?: string
}

export function LectureTemplate({ lecture, locale }: LectureTemplateProps) {
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
      {lecture.title ? (
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-700 mb-6">{lecture.title}</h1>
      ) : null}

      <VideoPlayer
        className="mb-4"
        defaultSubtitleLang={locale}
        hlsUrl={lecture.hlsUrl}
        poster={lecture.thumbnailUrl ?? undefined}
        startTime={lecture.startTime}
        stopTime={lecture.stopTime}
        subtitleTracks={lecture.subtitles}
        title={lecture.title ?? undefined}
      />

      {displaySeconds > 0 ? <Duration seconds={displaySeconds} variant="badge" /> : null}
    </article>
  )
}
