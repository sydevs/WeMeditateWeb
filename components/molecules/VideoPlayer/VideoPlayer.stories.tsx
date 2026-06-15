import type { Story, StoryDefault } from '@ladle/react'
import { VideoPlayer } from './VideoPlayer'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules / Media',
} satisfies StoryDefault

// Public HLS test stream (Mux) so the player actually loads in Ladle.
const HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
const POSTER = 'https://picsum.photos/seed/videoposter/1280/720'

const SUBTITLES = [
  { content: 'Welcome to this short meditation.', startTimeMs: 0, endTimeMs: 4000 },
  { content: 'Settle in and soften your gaze.', startTimeMs: 4000, endTimeMs: 8000 },
  { content: 'Let the breath find its own rhythm.', startTimeMs: 8000, endTimeMs: 12000 },
]

/**
 * VideoPlayer is a client-only HLS player: it prefers native HLS (Safari/iOS)
 * and otherwise lazy-loads hls.js. It supports a poster, inline subtitle cues
 * (rendered as a WebVTT track) and an optional [startTime, stopTime] window.
 *
 * Note: these stories import the raw player; in the app it's wrapped in
 * ClientOnly so hls.js stays out of the SSR/Workers bundle.
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
      description="Seeks to startTime on load and pauses at stopTime — used by Lectures to play a segment of a longer video."
      title="Playback window"
    >
      <div className="max-w-2xl">
        <VideoPlayer hlsUrl={HLS_URL} poster={POSTER} startTime={5} stopTime={15} />
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
