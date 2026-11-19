'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useCreateTextTrack, type TextCueInit } from '@videojs/react'
import { I18nProvider } from '@videojs/react/i18n'
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video'
import { VideoPlayer as VideoJsPlayer, VideoSkin, usePlayer } from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import './skin-overrides.css'
import { useLocale } from '../../../hooks/usePageContext'
import { holdInWindow, replayFrom, resolveClipWindow, type ClipWindow } from './clip'
import { ClipTimeline } from './clip-window'
import { toTextCues, type VideoSubtitleCue } from './subtitles'
import { posterURL } from './poster'

/**
 * Player theming, scoped to this instance, with no global CSS.
 *
 * `--media-accent-color` is one of the eight custom properties a packaged Video.js skin treats
 * as public, and every active state derives from it. Sourcing it from the brand token keeps the
 * player in step with the design system instead of duplicating the hex value.
 *
 * `--media-control-size` is the skin's own, and it ships at 36px — under the 44×44 this project
 * requires of every interactive element (docs/rules/design-system.md). Raising the token grows
 * every control at once, which is what the skin's buttons size themselves from; the `44px` is
 * the floor itself and not a design value, so it is written here rather than taken from a
 * spacing token.
 *
 * `--media-slider-height` takes that same floor, for the time and volume sliders. Their root is
 * the drag surface, and the skin ships it at 32px; the drawn track is a 4px `::before` centred
 * in that box. So raising it grows the hit area and nothing a viewer sees — measured at a 390px
 * viewport, the track stays 4px and the control bar stays the 48px the 44px buttons already
 * hold it at.
 */
const PLAYER_STYLE = {
  '--media-accent-color': 'var(--color-teal-500)',
  '--media-control-size': '44px',
  '--media-slider-height': '44px',
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
  /** Inline subtitle cues from the Video collection. */
  subtitles?: VideoSubtitleCue[]
  /** BCP-47 language tag for the inline-cue subtitle track. @default 'en' */
  subtitleLang?: string
  /**
   * Per-locale external WebVTT subtitle tracks (Lecture shape), as an
   * alternative to the inline-cue `subtitles` adapter above.
   */
  subtitleTracks?: { locale: string; url: string }[]
  /** Which `subtitleTracks` locale to mark as the default, active track. */
  defaultSubtitleLang?: string
  /** The video's title. The skin draws it across the top of the player, and names it. */
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

/** One subtitle track: inline cues from the Video collection, or a `.vtt` file to read them from. */
interface SubtitleTrackInit {
  language: string
  cues?: TextCueInit[]
  src?: string
}

/**
 * Adds one subtitle track to the player for as long as this is mounted.
 *
 * An app track takes its cues as data, or a `src` the player fetches and parses itself. Neither
 * puts a `<track>` on the media, so a cross-origin file forces no `crossorigin` — which would
 * break native HLS playback in Safari — and a host that serves `.vtt` as `text/plain` is read
 * all the same.
 */
function SubtitleTrack({ language, cues, src }: SubtitleTrackInit) {
  useCreateTextTrack({ kind: 'subtitles', label: language.toUpperCase(), language, cues, src })

  return null
}

/**
 * Turns the page's locale into the one subtitle track that shows, in place of the browser's.
 *
 * Video.js restores the last track a viewer chose, then one matching the *browser's* language,
 * then the first track — so a Russian browser would read English subtitles on a Russian page.
 * This applies the page's preference once and then leaves the viewer's own choices alone. With
 * no matching track it turns subtitles off.
 *
 * It waits for `expected`, the languages of the tracks this player added, rather than for the
 * list to be non-empty: `textTrackList` also carries whatever the HLS manifest declares and
 * tracks of other kinds, so a manifest's own track would otherwise spend the one shot.
 */
function SubtitlePreference({ lang, expected }: { lang?: string; expected: string[] }) {
  const tracks = usePlayer((state) => state.textTrackList)
  const selectSubtitlesTrack = usePlayer((state) => state.selectSubtitlesTrack)
  const appliedRef = useRef(false)
  const expectedKey = expected.join(' ')

  useEffect(() => {
    if (appliedRef.current) {
      return
    }
    const subtitles = tracks.filter(
      (track) => track.kind === 'subtitles' || track.kind === 'captions',
    )
    const waiting = expectedKey
      ? expectedKey.split(' ').some((locale) => !subtitles.some((t) => t.language === locale))
      : subtitles.length === 0

    if (waiting) {
      return
    }
    appliedRef.current = true
    const match = lang ? subtitles.find((track) => track.language === lang) : undefined

    void selectSubtitlesTrack(match?.id ?? null)
  }, [tracks, lang, expectedKey, selectSubtitlesTrack])

  return null
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

  // Both subtitle shapes reach the player as app text tracks: the Video collection's inline cues
  // as data, a Lecture's per-locale files as URLs the player reads.
  //
  // Keyed on content rather than array identity. The live preview re-resolves these props on
  // every render, and a fresh `cues` array makes the player drop and re-add the track, which
  // would turn the viewer's subtitles off mid-playback.
  const tracksKey = JSON.stringify([subtitles ?? null, subtitleLang, subtitleTracks ?? null])
  const tracks = useMemo<SubtitleTrackInit[]>(
    () =>
      subtitles?.length
        ? [{ language: subtitleLang, cues: toTextCues(subtitles) }]
        : (subtitleTracks ?? []).map((track) => ({ language: track.locale, src: track.url })),
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- `tracksKey` encodes every cue and every track URL, so a re-resolved prop differs only in array identity
    [tracksKey],
  )

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
        <VideoJsPlayer poster={posterURL(poster)} title={title}>
          {/* Video.js 10 ships no default box, and `index.tsx` matches its SSR poster to this
              one so hydration does not jump. */}
          <VideoSkin
            className="aspect-video w-full"
            data-wm-clip={clip ? '' : undefined}
            style={PLAYER_STYLE}
          >
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
            />
            {tracks.map((track) => (
              <SubtitleTrack key={track.language} {...track} />
            ))}
            <SubtitlePreference
              expected={tracks.map((track) => track.language)}
              lang={subtitles?.length ? subtitleLang : defaultSubtitleLang}
            />
            {clip ? <ClipTimeline window={clip} /> : null}
          </VideoSkin>
        </VideoJsPlayer>
      </I18nProvider>
    </div>
  )
}
