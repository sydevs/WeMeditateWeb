import type { Story, StoryDefault } from '@ladle/react'
import { useState } from 'react'
import { AudioPlayer, Track, AudioControl } from './AudioPlayer'
import { StoryWrapper, StorySection } from '../../ladle'
import { Checkbox } from '../../atoms'

export default {
  title: 'Molecules / Audio',
} satisfies StoryDefault

// Sample audio tracks for stories
const sampleTracks: Track[] = [
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Morning Meditation',
    credit: 'Rishi Nair',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/music1/200/200',
    duration: 196, // 3:16
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Ocean Waves',
    credit: 'Koushik Aithal',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/music2/200/200',
    duration: 242, // 4:02
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    title: 'Forest Ambience',
    credit: 'Sarah Chen',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/music3/200/200',
    duration: 318, // 5:18
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    title: 'Peaceful Piano',
    credit: 'David Martinez',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/music4/200/200',
    duration: 281, // 4:41
  },
]

/**
 * AudioPlayer component showcasing audio playback controls and playlist management.
 */
export const Default: Story = () => {
  const [disabledControls, setDisabledControls] = useState<AudioControl[]>([])

  const allControls: AudioControl[] = [
    'trackInfo',
    'progress',
    'skip',
    'shuffle',
    'volume',
  ]

  const toggleControl = (control: AudioControl) => {
    if (disabledControls.includes(control)) {
      setDisabledControls(disabledControls.filter((c) => c !== control))
    } else {
      setDisabledControls([...disabledControls, control])
    }
  }

  return (
    <StoryWrapper>
      <StorySection title="Basic">
        <div className="max-w-md">
          <AudioPlayer tracks={sampleTracks} />
        </div>
      </StorySection>

      <StorySection
        title="Configurable Controls"
        description="Toggle controls on and off to customize the player"
      >
        <div className="flex flex-col md:flex-row gap-12 p-4">
          {/* Control Checkboxes - stacks on mobile, column on desktop */}
          <div className="flex flex-col gap-3 p-4">
            {allControls.map((control) => (
              <Checkbox
                key={control}
                label={control.charAt(0).toUpperCase() + control.slice(1)}
                checked={!disabledControls.includes(control)}
                onChange={() => toggleControl(control)}
              />
            ))}
          </div>

          {/* Live Audio Player */}
          <div className="flex-1 max-w-md border-2 border-gray-200 rounded-lg p-4 self-center">
            <AudioPlayer tracks={sampleTracks} disabledControls={disabledControls} />
          </div>
        </div>
      </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="space-y-6">
        <StorySection title="Podcast Player" variant="subsection">
          <div className="max-w-lg mx-auto bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                PM
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Peaceful Moments
                </h3>
                <p className="text-sm text-gray-600">Daily Meditation Podcast</p>
              </div>
            </div>
            <AudioPlayer tracks={sampleTracks} />
          </div>
        </StorySection>

        <StorySection title="Square Player" variant="subsection">
          <div className="w-64 aspect-square mx-auto bg-white shadow-xl p-6 flex items-center justify-center">
            <AudioPlayer
              tracks={[sampleTracks[0]]}
              disabledControls={['trackInfo', 'progress', 'skip', 'shuffle']}
            />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
  )
}

Default.storyName = 'Audio Player'
