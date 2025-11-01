import type { Story, StoryDefault } from "@ladle/react";
import { IconButton } from "./IconButton";

export default {
  title: "Atoms / Interactive"
} satisfies StoryDefault;

/**
 * IconButton component showcasing all sizes, shapes, variants, states, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="heart" size="sm" aria-label="Like (small)" />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="heart" size="md" aria-label="Like (medium)" />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="heart" size="lg" aria-label="Like (large)" />
          <p className="text-sm text-gray-600">Large</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="play" variant="primary" aria-label="Play" />
          <p className="text-sm text-gray-600">Primary</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="pause" variant="secondary" aria-label="Pause" />
          <p className="text-sm text-gray-600">Secondary</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="heart" variant="outline" aria-label="Like" />
          <p className="text-sm text-gray-600">Outline</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="star" variant="ghost" aria-label="Favorite" />
          <p className="text-sm text-gray-600">Ghost</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Shapes</h3>
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="menu" shape="circle" aria-label="Menu" />
          <p className="text-sm text-gray-600">Circle</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon="menu" shape="square" aria-label="Menu" />
          <p className="text-sm text-gray-600">Square</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Common Icon Buttons</h3>
      <div className="flex gap-3 flex-wrap">
        <IconButton icon="play" variant="primary" aria-label="Play" />
        <IconButton icon="pause" variant="primary" aria-label="Pause" />
        <IconButton icon="heart" variant="outline" aria-label="Like" />
        <IconButton icon="star" variant="outline" aria-label="Favorite" />
        <IconButton icon="search" variant="ghost" aria-label="Search" />
        <IconButton icon="close" variant="ghost" aria-label="Close" />
        <IconButton icon="menu" variant="ghost" aria-label="Menu" />
        <IconButton icon="chevron-left" variant="ghost" aria-label="Previous" />
        <IconButton icon="chevron-right" variant="ghost" aria-label="Next" />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Disabled</p>
          <div className="flex gap-4">
            <IconButton icon="play" variant="primary" disabled aria-label="Play (disabled)" />
            <IconButton icon="pause" variant="secondary" disabled aria-label="Pause (disabled)" />
            <IconButton icon="heart" variant="outline" disabled aria-label="Like (disabled)" />
            <IconButton icon="star" variant="ghost" disabled aria-label="Favorite (disabled)" />
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Active/Hover</p>
          <div className="flex gap-4">
            <IconButton icon="heart" variant="primary" aria-label="Liked" />
            <IconButton icon="star" variant="secondary" aria-label="Favorited" />
            <IconButton icon="check" variant="outline" aria-label="Checked" />
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Media Player Controls</h3>
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">Guided Meditation</h4>
            <p className="text-sm text-gray-600">10 minutes</p>
          </div>
          <IconButton icon="heart" variant="outline" aria-label="Like meditation" />
        </div>
        <div className="flex items-center justify-center gap-4">
          <IconButton icon="chevron-left" variant="ghost" size="lg" aria-label="Previous track" />
          <IconButton icon="play" variant="primary" size="lg" aria-label="Play" />
          <IconButton icon="chevron-right" variant="ghost" size="lg" aria-label="Next track" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Card Actions</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden max-w-md">
        <div className="h-40 bg-teal-100 flex items-center justify-center">
          <p className="text-teal-700">Image placeholder</p>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Morning Meditation</h4>
              <p className="text-sm text-gray-600">Start your day with peace</p>
            </div>
            <div className="flex gap-2">
              <IconButton icon="heart" variant="ghost" size="sm" aria-label="Like" />
              <IconButton icon="star" variant="ghost" size="sm" aria-label="Favorite" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Navigation</h3>
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <IconButton icon="menu" variant="ghost" aria-label="Open menu" />
        <h2 className="text-xl font-semibold text-gray-900">We Meditate</h2>
        <IconButton icon="search" variant="ghost" aria-label="Search" />
      </div>
    </div>
  </div>
);

Default.storyName = "Icon Button"
