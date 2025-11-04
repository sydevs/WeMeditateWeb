import type { Story, StoryDefault } from "@ladle/react";
import { Spinner } from "./Spinner";
import {
  StorySection,
  StoryWrapper
} from '../../ladle';

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
        <div className="flex flex-col items-center gap-2">
          <Spinner color="neutral" />
          <p className="text-sm text-gray-600">Neutral (Gray)</p>
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Dark Theme"
      theme="dark"
      background="neutral"
      description="Lightened colors (teal-300, coral-300, white) for contrast on dark backgrounds"
    >
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner color="primary" theme="dark" />
          <p className="text-sm text-white">Primary (Light Teal)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner color="secondary" theme="dark" />
          <p className="text-sm text-white">Secondary (Light Coral)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner color="neutral" theme="dark" />
          <p className="text-sm text-white">Neutral (White)</p>
        </div>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-6">
        <StorySection title="Inline Loading" variant="subsection">
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <p className="text-gray-700">Processing your request...</p>
          </div>
        </StorySection>

        <StorySection title="Centered Loading" variant="subsection">
          <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <Spinner size="lg" />
            <p className="text-gray-600">Loading meditation...</p>
          </div>
        </StorySection>

        <StorySection title="Full Page Loading" variant="subsection">
          <div className="bg-white border border-gray-200 rounded-lg p-12 flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-lg text-gray-700">Loading your meditation session</p>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);
Default.storyName = "Spinner"
