import type { Story, StoryDefault } from '@ladle/react'
import { useState } from 'react'
import { Turnstile } from './Turnstile'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

/**
 * The Cloudflare Turnstile widget, rendered explicitly so it survives a
 * client-side navigation.
 *
 * Every public write to the CMS needs the token this produces, so a form that
 * does not mount it cannot submit at all. `CmsForm` is the real consumer.
 *
 * The keys below are Cloudflare's own published test keys, which never reach
 * a real challenge: `1x…AA` always solves, `2x…AB` always blocks. The widget
 * carries no copy of ours — everything inside the iframe is Cloudflare's,
 * localized from the page's `lang`.
 */
export const Default: Story = () => {
  const [solved, setSolved] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  return (
    <StoryWrapper>
      <StorySection
        description="A captcha that hands a single-use token to the form around it."
        title="States"
      >
        <div className="flex flex-col gap-8">
          <StorySection title="Always solves" variant="subsection">
            <Turnstile siteKey="1x00000000000000000000AA" onToken={setSolved} />
            <p className="mt-2 text-sm text-gray-600">
              Token: {solved ? `${solved.slice(0, 12)}…` : 'none yet'}
            </p>
          </StorySection>

          <StorySection title="Always blocks" variant="subsection">
            <Turnstile siteKey="2x00000000000000000000AB" onToken={setBlocked} />
            <p className="mt-2 text-sm text-gray-600">
              Token: {blocked ? `${blocked.slice(0, 12)}…` : 'none yet'}
            </p>
          </StorySection>
        </div>
      </StorySection>

      <StorySection title="Themes">
        <div className="flex flex-wrap gap-8">
          <Turnstile siteKey="1x00000000000000000000AA" theme="light" onToken={() => {}} />
          <Turnstile siteKey="1x00000000000000000000AA" theme="dark" onToken={() => {}} />
        </div>
      </StorySection>
    </StoryWrapper>
  )
}

Default.storyName = 'Turnstile'
