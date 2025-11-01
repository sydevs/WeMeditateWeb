import type { Story, StoryDefault } from "@ladle/react";
import { Textarea } from "./Textarea";
import { StorySection, StorySubsection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Textarea component showcasing all sizes, auto-resize, validation states, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Default">
          <Textarea placeholder="Enter your message..." />
        </StorySubsection>

        <StorySubsection label="With Auto-resize">
          <Textarea
            placeholder="Start typing to see auto-resize..."
            autoResize
          />
        </StorySubsection>

        <StorySubsection label="Custom Rows">
          <Textarea
            placeholder="Tall textarea with 8 rows"
            rows={8}
          />
        </StorySubsection>
      </div>
    </StorySection>

    <StorySection title="States">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default</p>
          <Textarea placeholder="Normal textarea" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Success</p>
          <Textarea
            state="success"
            defaultValue="Great feedback, thank you!"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Error</p>
          <Textarea
            state="error"
            defaultValue="Too short"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Disabled</p>
          <Textarea placeholder="Disabled textarea" disabled />
        </div>
      </div>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
Default.storyName = "Textarea"
