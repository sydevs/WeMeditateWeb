'use client'

import { useEffect, useMemo, useState } from 'react'
import { MediaPlayer, MediaProvider, Poster, Track, isHLSProvider } from '@vidstack/react'
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/poster.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import { cuesToVtt, type VideoSubtitleCue } from './vtt'

/**
 * Player accent, scoped to this instance, with no global CSS. Vidstack
 * derives its accent `--media-brand` from `--video-brand`
 * (`--media-brand: var(--video-brand, #f5f5f5)`), and it redeclares that on
 * the default layout's own element. So setting `--media-brand` here gets
 * overridden by the `#f5f5f5` fallback. Setting `--video-brand`, the
 * layout-level theming variable, instead tints the scrubber fill, the large
 * play button, and other active states with the brand teal token
 * (`--color-teal-500` = #61aaa0). This keeps the player in step with the
 * design system, instead of duplicating the hex value.
 */
const PLAYER_STYLE = { '--video-brand': 'var(--color-teal-500)' }

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
   * Per-locale external WebVTT subtitle tracks (Lecture shape). The player
   * fetches each `.vtt` URL and re-serves it as a same-origin blob
   * `<Track>`, as an alternative to the inline-cue `subtitles` adapter above.
   */
  subtitleTracks?: { locale: string; url: string }[]
  /** Which `subtitleTracks` locale to mark as the default, active track. */
  defaultSubtitleLang?: string
  /** Accessible label for the video (not shown visually). */
  title?: string
  /**
   * Begin loading the stream as soon as the player is visible, instead of
   * waiting for the viewer to press play. Use it for primary content, for
   * example a Lecture, where playback is the main intent. Leave it off for
   * secondary or embedded videos, to keep the initial load light: poster
   * only, until play. @default false
   */
  autoLoad?: boolean
  className?: string
}

/**
 * Shared HLS video player, built on Vidstack's `<MediaPlayer>` and its default layout.
 *
 * Vidstack supplies the themeable, touch-friendly control bar — larger
 * targets, a captions menu, fullscreen — over an internal `<video>`. HLS
 * plays natively where supported (Safari or iOS), and otherwise through this
 * project's bundled hls.js, which Vidstack loads lazily through
 * `provider.library`, so it stays out of the SSR/Workers bundle and the
 * initial client chunk. Subtitles come from either inline cues (Video
 * collection) or per-locale external `.vtt` URLs (Lectures).
 *
 * A `[startTime, stopTime]` window, a clip, passes to Vidstack's
 * `clipStartTime` and `clipEndTime` props. These relinearize the timeline to
 * `0:00` through the window length, seek to the start on load, and pause at
 * the stop.
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
  autoLoad = false,
  className,
}: VideoPlayerProps) {
  // Inline cues (Video collection) → a single inline WebVTT track. Vidstack
  // parses the VTT string directly, so this needs no blob URL or fetch.
  const inlineVtt = useMemo(
    () => (subtitles && subtitles.length ? cuesToVtt(subtitles) : null),
    [subtitles],
  )

  // Fetch the external per-locale .vtt files and re-serve them as same-origin
  // `text/vtt` blobs. Linking the URLs directly is brittle in two ways. Some
  // hosts serve .vtt as `text/plain`. And a cross-origin track forces
  // `crossorigin` on the media, which can break native HLS playback in
  // Safari. Blobs are same-origin, so this needs no crossOrigin, and the
  // video plays everywhere.
  const [trackBlobs, setTrackBlobs] = useState<{ locale: string; url: string }[]>([])

  // Stable key, so a fresh `subtitleTracks` array identity, for example one
  // re-resolved on every live-preview render, does not trigger a redundant refetch.
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
    // Keyed on the track URLs only (`tracksKey`), not on `defaultSubtitleLang`.
    // The active track is chosen at render time, so switching locale never
    // refetches or revokes a blob URL that a mounted <Track> still points to.
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
        // When `autoLoad` is set, content loads as soon as it is visible.
        // Otherwise hls.js and the stream wait until the viewer presses
        // play, though the poster still loads eagerly. This keeps the
        // initial load light, and it stops every instance on a page from
        // spinning up hls.js at once.
        load={autoLoad ? 'visible' : 'play'}
        poster={poster}
        src={{ src: hlsUrl, type: 'application/x-mpegurl' }}
        style={PLAYER_STYLE}
        title={title}
        // Use this project's bundled hls.js instead of Vidstack's default
        // CDN copy. The dynamic import keeps hls.js in a client-only chunk,
        // out of the Worker.
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
              default and subtitles stay off. That is better than forcing a
              non-locale language on the viewer. */}
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

        {/* The default layout does not render a poster from the `poster`
            prop. So this adds the Poster element, and its stylesheet, explicitly. */}
        {poster ? <Poster alt={title ?? ''} className="vds-poster" /> : null}

        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  )
}
