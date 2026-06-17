'use client'

import { useEffect, useMemo, useState } from 'react'
import { MediaPlayer, MediaProvider, Track, isHLSProvider } from '@vidstack/react'
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import { cuesToVtt, type VideoSubtitleCue } from './vtt'

/**
 * Player accent, scoped to this instance (no global CSS). Vidstack's default
 * layout reads `--media-brand` for the scrubber fill, the large play button, and
 * other active states; the rest of the bar stays neutral. We point it at the
 * brand teal token (`--color-teal-500` = #61aaa0, a `:root` custom property from
 * the Tailwind theme that inherits into Vidstack's shadow DOM) so the player
 * tracks the design system instead of duplicating the hex.
 */
const PLAYER_STYLE = { '--media-brand': 'var(--color-teal-500)' }

export interface VideoPlayerProps {
  /** HLS manifest URL (.m3u8). */
  hlsUrl: string
  /** Poster image shown before playback (and as a no-JS fallback frame). */
  poster?: string
  /** Seconds to seek to once metadata loads (start of a playback window). */
  startTime?: number | null
  /** Seconds at which to pause playback (end of a playback window). */
  stopTime?: number | null
  /** Inline subtitle cues from the Video collection (rendered as an inline VTT track). */
  subtitles?: VideoSubtitleCue[]
  /** BCP-47 language tag for the inline-cue subtitle track. @default 'en' */
  subtitleLang?: string
  /**
   * Per-locale external WebVTT subtitle tracks (Lecture shape). Each `.vtt` URL
   * is fetched and re-served as a same-origin blob `<Track>` — an alternative to
   * the inline-cue `subtitles` adapter above.
   */
  subtitleTracks?: { locale: string; url: string }[]
  /** Which `subtitleTracks` locale to mark as the default/active track. */
  defaultSubtitleLang?: string
  /** Accessible label for the video (not shown visually). */
  title?: string
  className?: string
}

/**
 * Shared HLS video player, built on Vidstack's `<MediaPlayer>` + default layout.
 *
 * Vidstack supplies the themeable, touch-friendly control bar (larger targets, a
 * captions menu, fullscreen) over an internal `<video>`. HLS plays natively where
 * supported (Safari/iOS) and otherwise via our bundled hls.js, loaded lazily by
 * Vidstack through `provider.library` so it stays out of the SSR/Workers bundle
 * and the initial client chunk. Subtitles come from either inline cues (Video
 * collection) or per-locale external `.vtt` URLs (Lectures).
 *
 * A `[startTime, stopTime]` window (a clip) is passed to Vidstack's
 * `clipStartTime`/`clipEndTime`, which relinearizes the timeline to `0:00` → the
 * window length, seeks to the start on load, and pauses at the stop.
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
  // Inline cues (Video collection) → a single inline WebVTT track. Vidstack
  // parses the VTT string directly, so no blob URL or fetch is needed.
  const inlineVtt = useMemo(
    () => (subtitles && subtitles.length ? cuesToVtt(subtitles) : null),
    [subtitles],
  )

  // Fetch the external per-locale .vtt files and re-serve them as same-origin
  // `text/vtt` blobs. Linking the URLs directly is brittle in two ways: some
  // hosts serve .vtt as `text/plain`, and a cross-origin track forces
  // `crossorigin` on the media, which can break native HLS playback in Safari.
  // Blobs are same-origin, so no crossOrigin is needed and the video plays
  // everywhere.
  const [trackBlobs, setTrackBlobs] = useState<{ locale: string; url: string }[]>([])

  // Stable key so a fresh `subtitleTracks` array identity (e.g. re-resolved on
  // every live-preview render) doesn't trigger a redundant refetch.
  const tracksKey = (subtitleTracks ?? []).map((t) => `${t.locale} ${t.url}`).join('')

  useEffect(() => {
    const tracks = subtitleTracks ?? []

    if (tracks.length === 0) {
      setTrackBlobs([])

      return
    }

    let cancelled = false
    const created: string[] = []

    void Promise.all(
      tracks.map(async (track) => {
        try {
          const res = await fetch(track.url)

          if (!res.ok) {
            return null
          }
          const url = URL.createObjectURL(new Blob([await res.text()], { type: 'text/vtt' }))

          created.push(url)

          return { locale: track.locale, url }
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) {
        return
      }
      setTrackBlobs(results.filter((r) => r !== null))
    })

    return () => {
      cancelled = true
      created.forEach((url) => URL.revokeObjectURL(url))
    }
    // Keyed on the track URLs only (`tracksKey`), not `defaultSubtitleLang`: the
    // active track is chosen at render time, so switching locale never refetches
    // or revokes blob URLs the mounted <Track>s still point at.
  }, [tracksKey])

  if (!hlsUrl) {
    return null
  }

  // A clip is a valid `[startTime, stopTime]` window. Vidstack relinearizes the
  // timeline to `0:00` → the window length, seeks to the start on load, and
  // pauses at the stop. `clipEndTime` of 0 means "play to the end".
  const clipStartTime = typeof startTime === 'number' && startTime > 0 ? startTime : 0
  const clipEndTime = typeof stopTime === 'number' && stopTime > clipStartTime ? stopTime : 0

  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-black ${className ?? ''}`}>
      <MediaPlayer
        playsInline
        aspectRatio="16/9"
        className="w-full"
        clipEndTime={clipEndTime}
        clipStartTime={clipStartTime}
        poster={poster}
        src={{ src: hlsUrl, type: 'application/x-mpegurl' }}
        style={PLAYER_STYLE}
        title={title}
        // Use our bundled hls.js instead of Vidstack's default CDN copy. The
        // dynamic import keeps hls.js in a client-only chunk (out of the Worker).
        onProviderChange={(provider) => {
          if (isHLSProvider(provider)) {
            provider.library = () => import('hls.js')
          }
        }}
      >
        <MediaProvider>
          {inlineVtt ? (
            <Track
              default
              content={inlineVtt}
              kind="subtitles"
              label={subtitleLang.toUpperCase()}
              lang={subtitleLang}
              type="vtt"
            />
          ) : null}
          {/* When defaultSubtitleLang matches none of the tracks, none is the
              default and subtitles stay off — preferable to forcing a non-locale
              language on the viewer. */}
          {trackBlobs.map((track) => (
            <Track
              key={track.locale}
              default={track.locale === defaultSubtitleLang}
              kind="subtitles"
              label={track.locale.toUpperCase()}
              lang={track.locale}
              src={track.url}
              type="vtt"
            />
          ))}
        </MediaProvider>

        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  )
}
