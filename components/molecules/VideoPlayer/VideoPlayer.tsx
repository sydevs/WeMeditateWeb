'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type HlsInstance from 'hls.js'
import { cuesToVtt, type VideoSubtitleCue } from './vtt'

const NATIVE_HLS_MIME = 'application/vnd.apple.mpegurl'

export interface VideoPlayerProps {
  /** HLS manifest URL (.m3u8). */
  hlsUrl: string
  /** Poster image shown before playback (and as a no-JS fallback frame). */
  poster?: string
  /** Seconds to seek to once metadata loads (start of a playback window). */
  startTime?: number | null
  /** Seconds at which to pause playback (end of a playback window). */
  stopTime?: number | null
  /** Inline subtitle cues from the Video collection (rendered as a Blob track). */
  subtitles?: VideoSubtitleCue[]
  /** BCP-47 language tag for the inline-cue subtitle track. @default 'en' */
  subtitleLang?: string
  /**
   * Per-locale external WebVTT subtitle tracks (Lecture shape). Each renders as
   * a `<track>` pointing directly at its `.vtt` URL — an alternative to the
   * inline-cue `subtitles` adapter above.
   */
  subtitleTracks?: { locale: string; url: string }[]
  /** Which `subtitleTracks` locale to mark as the default/active track. */
  defaultSubtitleLang?: string
  /** Accessible label for the video (not shown visually). */
  title?: string
  className?: string
}

/**
 * Shared HLS video player.
 *
 * Prefers native HLS where the browser supports it (Safari/iOS), otherwise
 * lazy-loads hls.js on the client. The dynamic `import('hls.js')` lives inside
 * an effect so hls.js stays out of the SSR/Workers bundle and out of the
 * initial client chunk. Supports an optional `[startTime, stopTime]` playback
 * window and subtitles via either inline cues (Video collection) or per-locale
 * external `.vtt` URLs (Lectures), both rendered as WebVTT `<track>`s.
 */
export function VideoPlayer({
  hlsUrl,
  poster,
  startTime,
  stopTime,
  subtitles,
  subtitleLang = 'en',
  subtitleTracks,
  defaultSubtitleLang,
  title,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [trackUrl, setTrackUrl] = useState<string>()

  // Attach the HLS source on the client: native HLS first, then hls.js.
  useEffect(() => {
    const video = videoRef.current

    if (!video || !hlsUrl) {
      return
    }

    let hls: HlsInstance | null = null
    let cancelled = false

    if (video.canPlayType(NATIVE_HLS_MIME)) {
      video.src = hlsUrl
    } else {
      void import('hls.js')
        .then(({ default: Hls }) => {
          if (cancelled || !videoRef.current) {
            return
          }
          if (Hls.isSupported()) {
            hls = new Hls()
            hls.loadSource(hlsUrl)
            hls.attachMedia(videoRef.current)
          } else {
            // Last resort — let the browser try directly.
            videoRef.current.src = hlsUrl
          }
        })
        .catch(() => {
          /* hls.js failed to load; the video simply stays unplayable */
        })
    }

    return () => {
      cancelled = true
      hls?.destroy()
    }
  }, [hlsUrl])

  // Enforce the optional [startTime, stopTime] playback window.
  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const onLoadedMetadata = () => {
      if (typeof startTime === 'number' && startTime > 0) {
        video.currentTime = startTime
      }
    }
    const onTimeUpdate = () => {
      if (typeof stopTime === 'number' && stopTime > 0 && video.currentTime >= stopTime) {
        video.pause()
      }
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('timeupdate', onTimeUpdate)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [startTime, stopTime])

  // Turn inline cues into a WebVTT blob URL (client-only — needs Blob/URL).
  const vtt = useMemo(
    () => (subtitles && subtitles.length ? cuesToVtt(subtitles) : null),
    [subtitles],
  )

  useEffect(() => {
    if (!vtt) {
      setTrackUrl(undefined)

      return
    }
    const url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }))

    setTrackUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [vtt])

  if (!hlsUrl) {
    return null
  }

  // External per-locale .vtt tracks (Lecture shape) render directly from their
  // URLs — no Blob needed — but the cross-origin text tracks require the video
  // element to opt into CORS. (The HLS manifest must then send CORS headers too;
  // Nirmala Vidya serves HLS + subtitles from the same origin.)
  const hasUrlTracks = Boolean(subtitleTracks?.length)

  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-black ${className ?? ''}`}>
      <video
        ref={videoRef}
        controls
        playsInline
        aria-label={title}
        className="h-auto w-full"
        crossOrigin={hasUrlTracks ? 'anonymous' : undefined}
        poster={poster}
        preload="metadata"
      >
        {trackUrl ? (
          <track
            default
            kind="subtitles"
            label={subtitleLang.toUpperCase()}
            src={trackUrl}
            srcLang={subtitleLang}
          />
        ) : null}
        {subtitleTracks?.map((track) => (
          <track
            key={track.locale}
            default={track.locale === defaultSubtitleLang}
            kind="subtitles"
            label={track.locale.toUpperCase()}
            src={track.url}
            srcLang={track.locale}
          />
        ))}
      </video>
    </div>
  )
}
