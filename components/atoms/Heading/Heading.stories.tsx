import type { Story } from "@ladle/react";
import { Heading, HeadingProps } from "./Heading";

export const AllLevels: Story = () => (
  <div className="flex flex-col gap-6">
    <Heading level="h1">Heading 1 - Main Page Title</Heading>
    <Heading level="h2">Heading 2 - Section Title</Heading>
    <Heading level="h3">Heading 3 - Subsection Title</Heading>
    <Heading level="h4">Heading 4 - Component Title</Heading>
    <Heading level="h5">Heading 5 - Small Title</Heading>
    <Heading level="h6">Heading 6 - Smallest Title</Heading>
  </div>
);

export const H1: Story<HeadingProps> = () => (
  <Heading level="h1">Main Page Title</Heading>
);

export const H2: Story<HeadingProps> = () => (
  <Heading level="h2">Section Title</Heading>
);

export const H3: Story<HeadingProps> = () => (
  <Heading level="h3">Subsection Title</Heading>
);

export const SemanticVsVisual: Story = () => (
  <div className="flex flex-col gap-6">
    <div>
      <p className="text-sm text-gray-600 mb-2">
        Semantic h3, styled as h1 (styleAs prop)
      </p>
      <Heading level="h3" styleAs="h1">
        Large visual style, but h3 in HTML
      </Heading>
    </div>

    <div>
      <p className="text-sm text-gray-600 mb-2">
        Semantic h1, styled as h3 (styleAs prop)
      </p>
      <Heading level="h1" styleAs="h3">
        Small visual style, but h1 in HTML
      </Heading>
    </div>
  </div>
);

export const CustomColors: Story = () => (
  <div className="flex flex-col gap-6">
    <Heading level="h2" className="text-teal-600">
      Teal Colored Heading
    </Heading>
    <Heading level="h2" className="text-coral-500">
      Coral Colored Heading
    </Heading>
    <Heading level="h2" className="text-gray-700">
      Gray Colored Heading
    </Heading>
  </div>
);

export const ResponsiveDemo: Story = () => (
  <div className="border-2 border-gray-300 rounded-lg p-6">
    <p className="text-sm text-gray-600 mb-4">
      Resize browser window to see responsive text sizing
    </p>
    <Heading level="h1">
      This heading gets larger on bigger screens
    </Heading>
  </div>
);

export const InContext: Story = () => (
  <article className="max-w-2xl">
    <Heading level="h1" className="mb-4">
      Guide to Meditation
    </Heading>
    <p className="text-gray-700 mb-6">
      Meditation is a practice of focused attention and awareness.
    </p>

    <Heading level="h2" className="mb-3">
      Getting Started
    </Heading>
    <p className="text-gray-700 mb-6">
      Begin with just a few minutes each day.
    </p>

    <Heading level="h3" className="mb-2">
      Finding a Quiet Space
    </Heading>
    <p className="text-gray-700 mb-6">
      Choose a comfortable, quiet location where you won't be disturbed.
    </p>

    <Heading level="h3" className="mb-2">
      Setting a Timer
    </Heading>
    <p className="text-gray-700 mb-6">
      Use a gentle timer to track your meditation sessions.
    </p>
  </article>
);
