import type { Story, StoryDefault } from "@ladle/react";
import { Text } from "./Text";
import { StorySection,
  StoryExampleSection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Text component showcasing all sizes, weights, colors, and combinations.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex flex-col gap-3">
        <Text size="xs">Extra small text (xs)</Text>
        <Text size="sm">Small text (sm)</Text>
        <Text size="base">Base text (base) - default</Text>
        <Text size="lg">Large text (lg)</Text>
        <Text size="xl">Extra large text (xl)</Text>
        <Text size="2xl">2X large text (2xl)</Text>
      </div>
    </StorySection>

    <StorySection title="Colors">
      <div className="flex flex-col gap-3">
        <Text color="default">Default color (gray-900)</Text>
        <Text color="primary">Primary color (teal-700)</Text>
        <Text color="secondary">Secondary color (coral-700)</Text>
        <Text color="tertiary">Tertiary color (gray-700)</Text>
        <div className="bg-teal-500 p-3 rounded text-white">
          <Text color="inherit">
            Inherit color (from parent)
          </Text>
        </div>
      </div>
    </StorySection>

    <StoryExampleSection>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Heading-style (2xl, bold, primary)</p>
          <Text size="2xl" weight="bold" color="primary">
            Large Bold Primary
          </Text>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Subtitle (lg, medium, secondary)</p>
          <Text size="lg" weight="medium" color="secondary">
            Medium Secondary
          </Text>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Body (base, light, primary)</p>
          <Text size="base" weight="light" color="primary">
            Default body text with light weight for comfortable reading
          </Text>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Caption (sm, light, tertiary)</p>
          <Text size="sm" weight="light" color="tertiary">
            Small tertiary for captions
          </Text>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">All weight variations</p>
          <div className="flex flex-col gap-2">
            <Text weight="extralight">Extra light weight (200)</Text>
            <Text weight="light">Light weight (300) - default</Text>
            <Text weight="normal">Normal weight (400)</Text>
            <Text weight="medium">Medium weight (500)</Text>
            <Text weight="semibold">Semibold weight (600)</Text>
            <Text weight="bold">Bold weight (700)</Text>
          </div>
        </div>
      </div>
    </StoryExampleSection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);

Default.storyName = "Text"
