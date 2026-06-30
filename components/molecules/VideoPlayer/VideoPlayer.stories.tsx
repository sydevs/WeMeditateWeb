import type { Story, StoryDefault } from '@ladle/react'
import { VideoPlayer } from './VideoPlayer'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// Vidstack's public demo HLS stream + assets, so the player actually loads and
// the captions menu has real per-locale .vtt tracks to switch between in Ladle.
const HLS_URL = 'https://files.vidstack.io/sprite-fight/hls/stream.m3u8'
const POSTER = 'https://files.vidstack.io/sprite-fight/poster.webp'

const SUBTITLES = [
  { content: 'Welcome to this short meditation.', startTimeMs: 0, endTimeMs: 4000 },
  { content: 'Settle in and soften your gaze.', startTimeMs: 4000, endTimeMs: 8000 },
  { content: 'Let the breath find its own rhythm.', startTimeMs: 8000, endTimeMs: 12000 },
]

// Per-locale external WebVTT tracks (the Lecture subtitle shape).
const SUBTITLE_TRACKS = [
  { locale: 'en', url: 'https://files.vidstack.io/sprite-fight/subs/english.vtt' },
  { locale: 'es', url: 'https://files.vidstack.io/sprite-fight/subs/spanish.vtt' },
]

/**
 * VideoPlayer is a client-only HLS player built on Vidstack's `<MediaPlayer>` +
 * default layout: brand-teal (#61aaa0), touch-friendly controls with a captions
 * menu over a native `<video>`. HLS plays natively (Safari/iOS) or via our
 * bundled hls.js. It supports a poster, an optional [startTime, stopTime] window
 * (relinearized via Vidstack clipping), and subtitles via either inline cues
 * (Video collection) or per-locale external .vtt URLs (Lectures).
 *
 * Note: these stories import the raw player; in the app it's wrapped in
 * ClientOnly so Vidstack and hls.js stay out of the SSR/Workers bundle.
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
      description="A [startTime, stopTime] window (a clip) is passed to Vidstack's clipStartTime/clipEndTime: the timeline is relinearized to 0:00 → the window length (0:10 here), not the underlying media position, and playback seeks to the start and pauses at the stop. Used by Lecture clips."
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
