import type { Story, StoryDefault } from '@ladle/react'
import { Countdown } from './Countdown'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Atoms',
} satisfies StoryDefault

/** Countdown component showcasing various timing durations and sizes. */
export const Default: Story = () => {
  // The atom holds no clock, so a story states the time left outright.
  const target = (seconds: number) => ({ remainingMs: seconds * 1000 })

  return (
    <StoryWrapper>
      <StorySection title="Sizes">
        <div className="flex flex-col gap-12 bg-gray-100 p-8 rounded-lg">
          {/* Small */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">Small</p>
            <Countdown {...target(3600)} size="sm" />
          </div>

          {/* Medium */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">Medium</p>
            <Countdown {...target(3600)} size="md" />
          </div>

          {/* Large */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">Large (default)</p>
            <Countdown {...target(3600)} size="lg" />
          </div>
        </div>
      </StorySection>

      <StorySection title="Various Timings">
        <div className="flex flex-col gap-12 bg-gray-100 p-8 rounded-lg">
          {/* 10 seconds */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">10 seconds</p>
            <Countdown {...target(10)} />
          </div>

          {/* 1 minute */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">1 minute</p>
            <Countdown {...target(60)} />
          </div>

          {/* 10 minutes */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">10 minutes</p>
            <Countdown {...target(600)} />
          </div>

          {/* 1 hour */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">1 hour</p>
            <Countdown {...target(3600)} />
          </div>

          {/* 10 hours */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">10 hours</p>
            <Countdown {...target(36000)} />
          </div>

          {/* 24 hours */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">24 hours</p>
            <Countdown {...target(86400)} />
          </div>
        </div>
      </StorySection>

      <StorySection title="States">
        <div className="flex flex-col gap-12 bg-gray-100 p-8 rounded-lg">
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">
              Over a day away — the days cell appears and hours stay 0&ndash;23
            </p>
            <Countdown {...target(200000)} size="md" />
          </div>

          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">
              With the sentence a screen reader reads instead of the digits
            </p>
            <Countdown
              announcement="The next session is Tuesday at 7:00 pm, in 1 hour."
              {...target(3600)}
              size="md"
            />
          </div>
        </div>
      </StorySection>

      <StorySection
        title="Dark Theme"
        surface="dark"
        background="neutral"
        description="White text for dark backgrounds"
      >
        <div className="text-center">
          <Countdown {...target(3600)} />
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Countdown'
