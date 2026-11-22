import type { Story, StoryDefault } from '@ladle/react'
import { Placeholder } from './Placeholder'
import { Icon } from '@/components/atoms/Icon'
import { ExclamationCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Atoms',
} satisfies StoryDefault

/**
 * Placeholder component showcasing blurred gradient backgrounds with optional shimmer animation.
 * Used as loading placeholders for images and content areas to prevent layout shift.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Colors">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Primary (Teal) - Animated</p>
          <Placeholder height={200} variant="primary" width={300} />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Secondary (Coral) - Animated</p>
          <Placeholder height={200} variant="secondary" width={300} />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Neutral (Gray) - Animated</p>
          <Placeholder height={200} variant="neutral" width={300} />
        </div>
      </div>
    </StorySection>

    <StorySection title="With Children">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Error State (No Animation)</p>
          <Placeholder animate={false} height={200} variant="neutral" width={300}>
            <Icon icon={ExclamationCircleIcon} size="lg" />
          </Placeholder>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Loading Icon (With Animation)</p>
          <Placeholder animate={true} height={200} variant="primary" width={300}>
            <Icon icon={PhotoIcon} size="lg" />
          </Placeholder>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Error with Coral Variant</p>
          <Placeholder animate={false} height={200} variant="secondary" width={300}>
            <Icon icon={ExclamationCircleIcon} size="lg" />
          </Placeholder>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Placeholder'
