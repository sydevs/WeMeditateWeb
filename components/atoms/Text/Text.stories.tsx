import type { Story, StoryDefault } from "@ladle/react";
import { Text } from "./Text";
import { StorySection, StoryWrapper } from '../../ladle';

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

    <StorySection title="Weights">
      <div className="flex flex-col gap-3">
        <Text weight="extralight">Extra light weight (200)</Text>
        <Text weight="light">Light weight (300) - default</Text>
        <Text weight="normal">Normal weight (400)</Text>
        <Text weight="medium">Medium weight (500)</Text>
        <Text weight="semibold">Semibold weight (600)</Text>
        <Text weight="bold">Bold weight (700)</Text>
      </div>
    </StorySection>

    <StorySection title="Colors">
      <div className="flex gap-5">
        <div className="flex flex-col gap-3">
          <Text color="default">Default color (gray-900)</Text>
          <Text color="primary">Primary color (teal-700)</Text>
          <Text color="secondary">Secondary color (coral-700)</Text>
          <Text color="faded">Faded color (gray-700)</Text>
          <div className="bg-teal-500 p-3 rounded text-white">
            <Text color="inherit">
              Inherit color (from parent)
            </Text>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Text color="default" weight="semibold">Default color (gray-900)</Text>
          <Text color="primary" weight="semibold">Primary color (teal-700)</Text>
          <Text color="secondary" weight="semibold">Secondary color (coral-700)</Text>
          <Text color="faded" weight="semibold">Faded color (gray-700)</Text>
          <div className="bg-teal-500 p-3 rounded text-white">
            <Text color="inherit" weight="semibold">
              Inherit color (from parent)
            </Text>
          </div>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Text"
