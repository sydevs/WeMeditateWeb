import type { CSSProperties } from 'react'
import type { Story, StoryDefault } from '@ladle/react'
import { VideoPlayer } from './VideoPlayer'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// A public demo HLS stream and its assets, so the player actually loads, and the captions menu
// has real per-locale .vtt tracks to switch between in Ladle. They outlived the player they came
// with and are fixtures, not a dependency.
const HLS_URL = 'https://files.vidstack.io/sprite-fight/hls/stream.m3u8'
const POSTER = 'https://files.vidstack.io/sprite-fight/poster.webp'

const SUBTITLES = [
  { content: 'Welcome to this short meditation.', startTimeMs: 0, endTimeMs: 4000 },
  { content: 'Settle in and soften your gaze.', startTimeMs: 4000, endTimeMs: 8000 },
  { content: 'Let the breath find its own rhythm.', startTimeMs: 8000, endTimeMs: 12000 },
]

/**
 * The ten launch locales, spelled as `server/sahajcloud-types.ts` spells them. Each has its own
 * pack in `@videojs/core`, and all ten key sets match English's.
 */
const LAUNCH_LOCALES = ['en', 'ru', 'it', 'es', 'fr', 'de', 'pt-BR', 'cs', 'uk', 'bg']

/** The language's own name, which is never a translation. */
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })
const localeLabel = (locale: string) => `${languageNames.of(locale) ?? locale} (${locale})`

/**
 * The skin shows only the large play button before playback starts, so the labels under review
 * here would need ten videos played to read. This is the one public property that reveals them.
 */
const CONTROLS_ALWAYS_VISIBLE = { '--media-controls-before-start': 'visible' } as CSSProperties

// Per-locale external WebVTT tracks (the Lecture subtitle shape).
const SUBTITLE_TRACKS = [
  { locale: 'en', url: 'https://files.vidstack.io/sprite-fight/subs/english.vtt' },
  { locale: 'es', url: 'https://files.vidstack.io/sprite-fight/subs/spanish.vtt' },
]

/**
 * VideoPlayer is a client-only HLS player, built on Video.js 10 and the skin
 * source vendored beside it: brand-teal (#61aaa0) through
 * `--media-accent-color`, touch-friendly controls with a captions menu and a
 * settings menu, over a native `<video>` that `HlsJsVideo` drives. It
 * supports a poster, an optional [startTime, stopTime] window, and subtitles
 * through either inline cues (Video collection) or per-locale external .vtt
 * URLs (Lectures).
 *
 * The control labels come from Video.js's own locale packs, so they read in
 * the visitor's language with nothing for this repo to translate. The
 * Languages section below is where that is checked.
 *
 * Note: these stories import the raw player. In the app it is wrapped in
 * ClientOnly, so Video.js stays out of the SSR/Workers bundle.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Player">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <div className="max-w-2xl">
            <VideoPlayer hlsUrl={HLS_URL} />
          </div>
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <div className="max-w-2xl">
            <VideoPlayer
              hlsUrl={HLS_URL}
              poster={POSTER}
              subtitleLang="en"
              subtitles={SUBTITLES}
              title="Guided breathing practice"
            />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection
      description="A [startTime, stopTime] window (a clip). Video.js 10 has no clipping, so the window is this repo's: the elapsed time and the scrubber run 0:00 to the window's length (0:10 here) rather than showing the media position, playback seeks to the start and pauses at the stop, and pressing play again restarts the window. Used by Lecture clips."
      title="Playback window (clip)"
    >
      <div className="max-w-2xl">
        <VideoPlayer hlsUrl={HLS_URL} poster={POSTER} startTime={5} stopTime={15} />
      </div>
    </StorySection>

    <StorySection
      description="Lectures supply subtitles as per-locale .vtt URLs; the track matching the current locale is the default. Pick a language from the player's CC menu."
      title="Per-locale subtitles (Lectures)"
    >
      <div className="max-w-2xl">
        <VideoPlayer
          defaultSubtitleLang="es"
          hlsUrl={HLS_URL}
          poster={POSTER}
          subtitleTracks={SUBTITLE_TRACKS}
          title="Lecture with per-locale subtitles"
        />
      </div>
    </StorySection>

    <StorySection
      description="The control labels, tooltips and menus come from Video.js's own locale packs, one lazy chunk per locale. Open each player's settings and captions menus and read every label: none may be in English. The controls are pinned visible here, which they are not before playback starts."
      title="Languages"
    >
      <div className="grid gap-8 md:grid-cols-2" style={CONTROLS_ALWAYS_VISIBLE}>
        {LAUNCH_LOCALES.map((locale) => (
          <StorySection key={locale} title={localeLabel(locale)} variant="subsection">
            <VideoPlayer
              hlsUrl={HLS_URL}
              locale={locale}
              poster={POSTER}
              subtitleLang="en"
              subtitles={SUBTITLES}
              title="Guided breathing practice"
            />
          </StorySection>
        ))}
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <article className="max-w-2xl">
        <h1 className="mb-4 text-3xl font-semibold text-gray-700">A Featured Talk</h1>
        <VideoPlayer className="mb-6" hlsUrl={HLS_URL} poster={POSTER} title="A Featured Talk" />
        <p className="text-gray-700">
          The video sits at the top of the article, above the body content.
        </p>
      </article>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Video Player'
