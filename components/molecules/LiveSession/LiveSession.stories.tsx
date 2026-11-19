import type { Story, StoryDefault } from '@ladle/react'
import { LiveSession } from './LiveSession'
import { StoryWrapper, StorySection } from '../../ladle'
import type { SessionSchedule } from '../../../lib/live-session'

export default {
  title: 'Molecules',
} satisfies StoryDefault

const LONDON = {
  timeZone: 'Europe/London',
  endTime: '20:30',
  joinUrl: 'https://example.invalid/room',
}

/** A schedule whose next session is `minutes` away, with one more a week later. */
const schedule = (minutes: number, overrides: Partial<SessionSchedule> = {}): SessionSchedule => {
  const next = Date.now() + minutes * 60_000

  return {
    ...LONDON,
    starts: [new Date(next).toISOString(), new Date(next + 7 * 86_400_000).toISOString()],
    ...overrides,
  }
}

/** The live-meditation panel, in each of the states a visitor can land on. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      title="States"
      description="A story runs in the browser, so every panel here is already past its first render — the one the server produces, which shows the class's own clock and nothing ticking."
    >
      <div className="flex flex-col gap-12 rounded-lg bg-gray-100 p-8">
        <StorySection title="Days away" variant="subsection">
          <LiveSession schedule={schedule(3 * 24 * 60)} />
        </StorySection>

        <StorySection title="Inside the final hour" variant="subsection">
          <LiveSession schedule={schedule(40)} />
        </StorySection>

        <StorySection title="Under way" variant="subsection">
          <LiveSession schedule={schedule(-10)} />
        </StorySection>

        <StorySection title="No joining link, so no button" variant="subsection">
          <LiveSession schedule={schedule(40, { joinUrl: null })} />
        </StorySection>

        <StorySection title="Nothing left on the calendar" variant="subsection">
          <LiveSession schedule={{ ...LONDON, starts: [] }} />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Dark Theme" surface="dark" background="neutral">
      <LiveSession schedule={schedule(40)} />
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'LiveSession'
