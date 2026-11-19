'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { I18nProvider } from '@videojs/react/i18n'
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video'
import { VideoPlayer as VideoJsPlayer, usePlayer } from '@videojs/react/video'
import { useLocale } from '../../../hooks/usePageContext'
import { holdInWindow, replayFrom, resolveClipWindow, type ClipWindow } from './clip'
import { ClipWindowContext } from './clip-window'
import { VideoSkin } from './skin/video/skin'
import { cuesToVtt, type VideoSubtitleCue } from './vtt'
import { posterURL } from './poster'

/**
 * Player theming, scoped to this instance, with no global CSS.
 *
 * `--media-accent-color` is one of the eight custom properties a packaged Video.js skin treats
 * as public, and the vendored skin derives every active state from it. Sourcing it from the
 * brand token keeps the player in step with the design system instead of duplicating the hex
 * value.
 *
 * `--media-control-size` is the skin's own, and it ships at 36px — under the 44×44 this project
 * requires of every interactive element (docs/rules/design-system.md). Raising the token grows
 * every control at once, which is what the skin's buttons size themselves from; the `44px` is
 * the floor itself and not a design value, so it is written here rather than taken from a
 * spacing token.
 */
const PLAYER_STYLE = {
  '--media-accent-color': 'var(--color-teal-500)',
  '--media-control-size': '44px',
} as CSSProperties

export interface VideoPlayerProps {
  /** HLS manifest URL (.m3u8). */
  hlsUrl: string
  /** Poster image shown before playback (and as a no-JS fallback frame). */
  poster?: string
  /**
   * The `sizes` the server-rendered poster declares, where this player is not
   * inside the layout its default assumes. The mounted player's own poster takes one
   * URL, so it keeps a single width whatever this says.
   * @default the bounded `max-w-4xl` case
   */
  posterSizes?: string
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
   * `<track>`, as an alternative to the inline-cue `subtitles` adapter above.
   */
  subtitleTracks?: { locale: string; url: string }[]
  /** Which `subtitleTracks` locale to mark as the default, active track. */
  defaultSubtitleLang?: string
  /** Accessible label for the video (not shown visually). */
  title?: string
  /**
   * Which language the player's own controls speak. Defaults to the page's locale, which is
   * what every in-app caller wants; the embed route and the live preview pass their own.
   */
  locale?: string
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
 * Turns the page's locale into the one subtitle track that shows, in place of the browser's.
 *
 * Video.js restores the last track a viewer chose, then one matching the *browser's* language,
 * then the first track — so the `default` attribute alone no longer decides, and a Russian
 * browser would read English subtitles on a Russian page. This applies the page's preference
 * once, the first time tracks attach, and then leaves the viewer's own choices alone. With no
 * matching track it turns subtitles off, which is what the `default` attribute used to mean.
 */
function SubtitlePreference({ lang }: { lang?: string }) {
  const tracks = usePlayer((state) => state.textTrackList)
  const selectSubtitlesTrack = usePlayer((state) => state.selectSubtitlesTrack)
  const appliedRef = useRef(false)

  useEffect(() => {
    if (appliedRef.current || tracks.length === 0) {
      return
    }
    appliedRef.current = true
    const match = lang ? tracks.find((track) => track.language === lang) : undefined

    void selectSubtitlesTrack(match?.id ?? null)
  }, [tracks, lang, selectSubtitlesTrack])

  return null
}

/** The subtitle tracks the player renders: one blob URL per language, plus which is default. */
interface TrackBlob {
  locale: string
  url: string
}

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
  locale,
  autoLoad = false,
  className,
}: VideoPlayerProps) {
  const pageLocale = useLocale()
  const clip = useMemo<ClipWindow | null>(
    () => resolveClipWindow(startTime, stopTime),
    [startTime, stopTime],
  )

  // Inline cues (Video collection) → one WebVTT document, served through the same blob
  // mechanism as the external tracks below, so there is one subtitle code path.
  const inlineVtt = useMemo(
    () => (subtitles && subtitles.length ? cuesToVtt(subtitles) : null),
    [subtitles],
  )

  // The external per-locale .vtt files are re-served as same-origin `text/vtt` blobs. Linking
  // the URLs directly is brittle in two ways. Some hosts serve .vtt as `text/plain`. And a
  // cross-origin track forces `crossorigin` on the media, which can break native HLS playback
  // in Safari. Blobs are same-origin, so this needs no crossOrigin, and the video plays
  // everywhere.
  const [trackBlobs, setTrackBlobs] = useState<TrackBlob[]>([])

  // Stable key, so a fresh `subtitleTracks` array identity, for example one
  // re-resolved on every live-preview render, does not trigger a redundant refetch.
  const tracksKey = (subtitleTracks ?? []).map((t) => `${t.locale} ${t.url}`).join('')

  useEffect(() => {
    const created: string[] = []
    const toBlobUrl = (vtt: string): string => {
      const url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }))

      created.push(url)

      return url
    }
    const revoke = () => created.forEach((url) => URL.revokeObjectURL(url))

    if (inlineVtt) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- the blob URL only exists once the effect has made it, so there is nothing to compute during render
      setTrackBlobs([{ locale: subtitleLang, url: toBlobUrl(inlineVtt) }])

      return revoke
    }

    const tracks = subtitleTracks ?? []

    if (tracks.length === 0) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- a no-op on mount, since `trackBlobs` starts empty; it clears blobs only when the tracks go away
      setTrackBlobs([])

      return revoke
    }

    let cancelled = false

    void Promise.all(
      tracks.map(async (track) => {
        try {
          const res = await fetch(track.url)

          if (!res.ok) {
            return null
          }

          return { locale: track.locale, url: toBlobUrl(await res.text()) }
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
      revoke()
    }
    // Keyed on the track URLs only (`tracksKey`), not on `defaultSubtitleLang`.
    // The active track is chosen once the tracks attach, so switching locale never
    // refetches or revokes a blob URL that a mounted <track> still points to.
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- `tracksKey` encodes every track's locale and url, so a stale `subtitleTracks` differs only in array identity
  }, [tracksKey, inlineVtt, subtitleLang])

  // `load="visible"` is gone (videojs/video.js#3043) and media loads as soon as it attaches, so
  // `preload="none"` holds every player at the poster and this observer is what lets an
  // `autoLoad` player start buffering when it scrolls into view. Widening `preload` is enough:
  // the hls.js media reads it and starts the load.
  const frameRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = frameRef.current

    if (!autoLoad || !element || typeof IntersectionObserver === 'undefined') {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [autoLoad])

  if (!hlsUrl) {
    return null
  }

  // The window is ours to enforce, on the media element itself: `clip.ts` decides, this applies.
  const holdWindow = (media: HTMLVideoElement) => {
    const correction = holdInWindow(clip, media.currentTime)

    if (correction?.kind === 'seek') {
      media.currentTime = correction.time
    } else if (correction?.kind === 'pause') {
      media.pause()
    }
  }

  return (
    <div
      ref={frameRef}
      className={`relative w-full overflow-hidden rounded-lg bg-black ${className ?? ''}`}
    >
      <I18nProvider locale={locale ?? pageLocale}>
        <ClipWindowContext value={clip}>
          <VideoJsPlayer poster={posterURL(poster)} title={title}>
            {/* Video.js 10 ships no default box, and `index.tsx` matches its SSR poster to this
                one so hydration does not jump. */}
            <VideoSkin className="aspect-video w-full" style={PLAYER_STYLE}>
              <HlsJsVideo
                playsInline
                preload={autoLoad && visible ? 'auto' : 'none'}
                src={hlsUrl}
                onLoadedMetadata={(event) => {
                  if (clip && clip.start > 0) {
                    event.currentTarget.currentTime = clip.start
                  }
                }}
                onPlay={(event) => {
                  const from = replayFrom(clip, event.currentTarget.currentTime)

                  if (from !== null) {
                    event.currentTarget.currentTime = from
                  }
                }}
                onTimeUpdate={(event) => holdWindow(event.currentTarget)}
              >
                {trackBlobs.map((track) => (
                  <track
                    key={track.locale}
                    default={track.locale === (inlineVtt ? subtitleLang : defaultSubtitleLang)}
                    kind="subtitles"
                    label={track.locale.toUpperCase()}
                    src={track.url}
                    srcLang={track.locale}
                  />
                ))}
              </HlsJsVideo>
              <SubtitlePreference lang={inlineVtt ? subtitleLang : defaultSubtitleLang} />
            </VideoSkin>
          </VideoJsPlayer>
        </ClipWindowContext>
      </I18nProvider>
    </div>
  )
}
