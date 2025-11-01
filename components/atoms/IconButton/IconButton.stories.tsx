import type { Story, StoryDefault } from "@ladle/react";
import { IconButton } from "./IconButton";
import {
  PlayIcon,
  PauseIcon,
  HeartIcon,
  StarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

export default {
  title: "Atoms / Interactive"
} satisfies StoryDefault;

/**
 * IconButton component showcasing all sizes, shapes, variants, and states.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <IconButton icon={HeartIcon} size="sm" aria-label="Like (small)" />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon={HeartIcon} size="md" aria-label="Like (medium)" />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <IconButton icon={HeartIcon} size="lg" aria-label="Like (large)" />
          <p className="text-sm text-gray-600">Large</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants & Shapes</h3>
      <div className="inline-grid" style={{ gridTemplateColumns: 'auto repeat(4, 1fr)', gap: '1rem' }}>
        {/* Header row */}
        <div></div>
        <div className="text-center text-sm font-medium text-gray-600">Default</div>
        <div className="text-center text-sm font-medium text-gray-600">Primary</div>
        <div className="text-center text-sm font-medium text-gray-600">Secondary</div>
        <div className="text-center text-sm font-medium text-gray-600">Ghost</div>

        {/* Circle row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Circle</div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="default" shape="circle" aria-label="Default circle" />
        </div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="primary" shape="circle" aria-label="Primary circle" />
        </div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="secondary" shape="circle" aria-label="Secondary circle" />
        </div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="ghost" shape="circle" aria-label="Ghost circle" />
        </div>

        {/* Square row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Square</div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="default" shape="square" aria-label="Default square" />
        </div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="primary" shape="square" aria-label="Primary square" />
        </div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="secondary" shape="square" aria-label="Secondary square" />
        </div>
        <div className="flex justify-center">
          <IconButton icon={PlayIcon} variant="ghost" shape="square" aria-label="Ghost square" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Common Icon Buttons</h3>
      <div className="flex gap-3 flex-wrap">
        <IconButton icon={PlayIcon} variant="primary" aria-label="Play" />
        <IconButton icon={PauseIcon} variant="primary" aria-label="Pause" />
        <IconButton icon={HeartIcon} variant="default" aria-label="Like" />
        <IconButton icon={StarIcon} variant="default" aria-label="Favorite" />
        <IconButton icon={MagnifyingGlassIcon} variant="ghost" aria-label="Search" />
        <IconButton icon={XMarkIcon} variant="ghost" aria-label="Close" />
        <IconButton icon={Bars3Icon} variant="ghost" aria-label="Menu" />
        <IconButton icon={ChevronLeftIcon} variant="ghost" aria-label="Previous" />
        <IconButton icon={ChevronRightIcon} variant="ghost" aria-label="Next" />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Disabled</p>
          <div className="flex gap-4">
            <IconButton icon={PlayIcon} variant="primary" disabled aria-label="Play (disabled)" />
            <IconButton icon={PauseIcon} variant="secondary" disabled aria-label="Pause (disabled)" />
            <IconButton icon={HeartIcon} variant="default" disabled aria-label="Like (disabled)" />
            <IconButton icon={StarIcon} variant="ghost" disabled aria-label="Favorite (disabled)" />
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Active/Hover</p>
          <div className="flex gap-4">
            <IconButton icon={HeartIcon} variant="primary" aria-label="Liked" />
            <IconButton icon={StarIcon} variant="secondary" aria-label="Favorited" />
            <IconButton icon={CheckIcon} variant="default" aria-label="Checked" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

Default.storyName = "Icon Button"
