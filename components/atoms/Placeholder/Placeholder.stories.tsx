import type { Story, StoryDefault } from "@ladle/react";
import { Placeholder } from "./Placeholder";
import { Icon } from '../Icon'
import { ExclamationCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Atoms / Feedback"
} satisfies StoryDefault;

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
          <Placeholder width={300} height={200} variant="primary" />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Secondary (Coral) - Animated</p>
          <Placeholder width={300} height={200} variant="secondary" />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Neutral (Gray) - Animated</p>
          <Placeholder width={300} height={200} variant="neutral" />
        </div>
      </div>
    </StorySection>

    <StorySection title="With Children">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Error State (No Animation)</p>
          <Placeholder width={300} height={200} variant="neutral" animate={false}>
            <Icon icon={ExclamationCircleIcon} size="lg" />
          </Placeholder>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Loading Icon (With Animation)</p>
          <Placeholder width={300} height={200} variant="primary" animate={true}>
            <Icon icon={PhotoIcon} size="lg" />
          </Placeholder>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Error with Coral Variant</p>
          <Placeholder width={300} height={200} variant="secondary" animate={false}>
            <Icon icon={ExclamationCircleIcon} size="lg" />
          </Placeholder>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Placeholder"
