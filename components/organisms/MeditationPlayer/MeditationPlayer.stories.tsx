import type { Story, StoryDefault } from '@ladle/react'
import { MeditationPlayer } from './MeditationPlayer'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * MeditationPlayer component showcasing meditation audio playback with
 * responsive layouts, instructor info, and meditation illustration.
 */
export const Default: Story = () => {
  const sampleTrack = {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Delving Deeper',
    credit: 'Shri Mataji Nirmala Devi',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/meditation1/400/400',
    duration: 485, // 8:05
  }

  const sampleFrames = [
    {
      timestamp: 0,
      media: {
        type: 'image' as const,
        src: 'https://picsum.photos/seed/meditation-pose1/800/800',
      },
    },
    {
      timestamp: 120,
      media: {
        type: 'image' as const,
        src: 'https://picsum.photos/seed/meditation-pose2/800/800',
      },
    },
    {
      timestamp: 240,
      media: {
        type: 'image' as const,
        src: 'https://picsum.photos/seed/meditation-pose3/800/800',
      },
    },
    {
      timestamp: 360,
      media: {
        type: 'image' as const,
        src: 'https://picsum.photos/seed/meditation-pose4/800/800',
      },
    },
  ]

  return (
    <StoryWrapper>
      <StorySection title="Vertical Layout (Mobile)">
        <div className="w-full max-w-md mx-auto">
          <MeditationPlayer
            track={sampleTrack}
            title="Delving Deeper"
            subtitle="All pervading power"
            frames={sampleFrames}
          />
        </div>
      </StorySection>

      <StorySection title="Horizontal Layout (Tablet+)">
        <div className="w-full">
          <MeditationPlayer
            track={sampleTrack}
            title="Delving Deeper"
            subtitle="All pervading power"
            frames={sampleFrames}
          />
        </div>
      </StorySection>
    </StoryWrapper>
  )
}

Default.storyName = 'Meditation Player'
