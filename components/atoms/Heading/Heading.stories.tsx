import type { Story, StoryDefault } from "@ladle/react";
import { Heading } from "./Heading";

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Heading component showcasing all semantic levels, styling options, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">All Heading Levels</h3>
      <div className="flex flex-col gap-4">
        <Heading level="h1">Heading 1 - Main Page Title</Heading>
        <Heading level="h2">Heading 2 - Section Title</Heading>
        <Heading level="h3">Heading 3 - Subsection Title</Heading>
        <Heading level="h4">Heading 4 - Component Title</Heading>
        <Heading level="h5">Heading 5 - Small Title</Heading>
        <Heading level="h6">Heading 6 - Smallest Title</Heading>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context</h3>
      <article className="max-w-2xl">
        <Heading level="h1" className="mb-4">
          Guide to Meditation
        </Heading>
        <p className="text-gray-700 mb-6">
          Meditation is a practice of focused attention and awareness that has been
          practiced for thousands of years in various cultures around the world.
        </p>

        <Heading level="h2" className="mb-3">
          Getting Started
        </Heading>
        <p className="text-gray-700 mb-6">
          Begin with just a few minutes each day in a quiet, comfortable space.
          Consistency is more important than duration when starting out.
        </p>

        <Heading level="h3" className="mb-2">
          Finding a Quiet Space
        </Heading>
        <p className="text-gray-700 mb-6">
          Choose a comfortable, quiet location where you won't be disturbed. This
          could be a corner of your bedroom, a peaceful spot in your garden, or
          anywhere you feel at ease.
        </p>

        <Heading level="h3" className="mb-2">
          Setting a Timer
        </Heading>
        <p className="text-gray-700 mb-6">
          Use a gentle timer to track your meditation sessions. Start with 5-10
          minutes and gradually increase as you become more comfortable with the
          practice.
        </p>
      </article>
    </div>
  </div>
);

Default.storyName = "Heading"
