import type { Story, StoryDefault } from "@ladle/react";
import { Spinner } from "./Spinner";
import { StorySection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * Spinner component showcasing all sizes, colors, and usage in context with loading states.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="sm" />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="md" />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-gray-600">Large</p>
        </div>
      </div>
    </StorySection>

    <StorySection title="Colors">
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner color="primary" />
          <p className="text-sm text-gray-600">Primary (Teal)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner color="secondary" />
          <p className="text-sm text-gray-600">Secondary (Coral)</p>
        </div>
        <div className="bg-gray-900 p-4 rounded flex flex-col items-center gap-2">
          <Spinner color="white" />
          <p className="text-sm text-white">White</p>
        </div>
      </div>
    </StorySection>

    <StorySection title="Examples - Centered Loading">
      <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Spinner size="lg" />
        <p className="text-gray-600">Loading meditation...</p>
      </div>
    </StorySection>

    <StorySection title="Examples - Inline Loading">
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <p className="text-gray-700">Processing your request...</p>
      </div>
    </StorySection>

    <StorySection title="Examples - Full Page Loading">
      <div className="bg-white border border-gray-200 rounded-lg p-12 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-lg text-gray-700">Loading your meditation session</p>
          <p className="text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
Default.storyName = "Spinner"
