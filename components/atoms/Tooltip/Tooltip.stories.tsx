import type { Story, StoryDefault } from '@ladle/react'
import { Tooltip } from './Tooltip'
import { Button } from '../Button'
import { StorySection, StoryWrapper } from '../../ladle'
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/solid'

export default {
  title: 'Atoms / Interactive',
} satisfies StoryDefault

/**
 * Tooltip showing a short hint on hover or keyboard focus. Viewport-aware
 * (flips/shifts near edges) and portaled so it is never clipped.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic">
      <p className="mb-6 max-w-prose text-sm text-gray-600">
        Hover (or tab to) the trigger to reveal the tooltip. It appears after a short delay on hover
        and immediately on keyboard focus.
      </p>
      <Tooltip label="Change background music track">
        <Button
          aria-label="Shuffle music track"
          icon={ArrowPathRoundedSquareIcon}
          size="md"
          variant="ghost"
        />
      </Tooltip>
    </StorySection>

    <StorySection title="Sides">
      <div className="flex flex-wrap gap-12 py-8">
        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
          <StorySection key={side} title={`side="${side}"`} variant="subsection">
            <Tooltip label={`Tooltip on the ${side}`} side={side}>
              <Button variant="secondary">{side}</Button>
            </Tooltip>
          </StorySection>
        ))}
      </div>
    </StorySection>

    <StorySection title="On text">
      <p className="text-sm text-gray-600">
        Tooltips also work on inline triggers, like{' '}
        <Tooltip label="An explanatory note">
          <span className="cursor-help underline decoration-dotted">this term</span>
        </Tooltip>
        .
      </p>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Tooltip'
