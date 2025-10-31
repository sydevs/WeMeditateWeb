import type { Story } from "@ladle/react";
import { Text, TextProps } from "./Text";

export const Default: Story<TextProps> = () => (
  <Text>This is default paragraph text with light weight</Text>
);

export const Sizes: Story = () => (
  <div className="flex flex-col gap-4">
    <Text size="xs">Extra small text (xs)</Text>
    <Text size="sm">Small text (sm)</Text>
    <Text size="base">Base text (base) - default</Text>
    <Text size="lg">Large text (lg)</Text>
    <Text size="xl">Extra large text (xl)</Text>
    <Text size="2xl">2X large text (2xl)</Text>
  </div>
);

export const Weights: Story = () => (
  <div className="flex flex-col gap-4">
    <Text weight="extralight">Extra light weight text</Text>
    <Text weight="light">Light weight text (default)</Text>
    <Text weight="normal">Normal weight text</Text>
    <Text weight="medium">Medium weight text</Text>
    <Text weight="semibold">Semibold weight text</Text>
    <Text weight="bold">Bold weight text</Text>
  </div>
);

export const Colors: Story = () => (
  <div className="flex flex-col gap-4">
    <Text color="primary">Primary color (gray-900) - default</Text>
    <Text color="secondary">Secondary color (gray-700)</Text>
    <Text color="tertiary">Tertiary color (gray-600)</Text>
    <div className="bg-teal-500 p-4 rounded">
      <Text color="inherit" className="text-white">
        Inherit color (from parent)
      </Text>
    </div>
  </div>
);

export const AsSpan: Story<TextProps> = () => (
  <div>
    <Text as="p">
      This is a paragraph with{" "}
      <Text as="span" weight="bold" color="secondary">
        inline span text
      </Text>{" "}
      inside of it.
    </Text>
  </div>
);

export const AsDiv: Story<TextProps> = () => (
  <Text as="div" size="lg" weight="medium">
    This is rendered as a div element
  </Text>
);

export const Combinations: Story = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Heading-like Text</h3>
      <Text size="2xl" weight="bold" color="primary">
        Large Bold Primary Text
      </Text>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Subtitle</h3>
      <Text size="lg" weight="medium" color="secondary">
        Medium weight secondary text for subtitles
      </Text>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Body Copy</h3>
      <Text size="base" weight="light" color="primary">
        Default body text with light weight. This is the most common text style
        used throughout the application for paragraph content.
      </Text>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Caption</h3>
      <Text size="sm" weight="light" color="tertiary">
        Small tertiary text for captions and metadata
      </Text>
    </div>
  </div>
);
