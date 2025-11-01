import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./Button";
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
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Unified Button component showcasing all variants, sizes, shapes, and use cases.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    {/* Comprehensive Variants Matrix */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
      <div className="overflow-x-auto">
        <table>
          <thead>
            {/* Top-level headers */}
            <tr>
              <th></th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700">Icon</th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700">Icon & Text</th>
            </tr>
            {/* Second-level headers */}
            <tr>
              <th></th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Square</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Circular</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Square</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Circular</th>
            </tr>
          </thead>
          <tbody>
            {/* Primary Row */}
            <tr>
              <td className="px-3 py-2 text-sm font-medium text-gray-700">Primary</td>
              <td className="px-3 py-2 text-center">
                <Button icon={PlayIcon} variant="primary" shape="square" aria-label="Play" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={PlayIcon} variant="primary" shape="circular" aria-label="Play" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={PlayIcon} variant="primary" shape="square">Button</Button>
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={PlayIcon} variant="primary" shape="circular">Button</Button>
              </td>
            </tr>

            {/* Secondary Row */}
            <tr>
              <td className="px-3 py-2 text-sm font-medium text-gray-700">Secondary</td>
              <td className="px-3 py-2 text-center">
                <Button icon={HeartIcon} variant="secondary" shape="square" aria-label="Like" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={HeartIcon} variant="secondary" shape="circular" aria-label="Like" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={HeartIcon} variant="secondary" shape="square">Button</Button>
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={HeartIcon} variant="secondary" shape="circular">Button</Button>
              </td>
            </tr>

            {/* Outline Row */}
            <tr>
              <td className="px-3 py-2 text-sm font-medium text-gray-700">Outline</td>
              <td className="px-3 py-2 text-center">
                <Button icon={StarIcon} variant="outline" shape="square" aria-label="Favorite" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={StarIcon} variant="outline" shape="circular" aria-label="Favorite" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={StarIcon} variant="outline" shape="square">Button</Button>
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={StarIcon} variant="outline" shape="circular">Button</Button>
              </td>
            </tr>

            {/* Ghost Row */}
            <tr>
              <td className="px-3 py-2 text-sm font-medium text-gray-700">Ghost</td>
              <td className="px-3 py-2 text-center">
                <Button icon={XMarkIcon} variant="ghost" shape="square" aria-label="Close" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={XMarkIcon} variant="ghost" shape="circular" aria-label="Close" />
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={XMarkIcon} variant="ghost" shape="square">Button</Button>
              </td>
              <td className="px-3 py-2 text-center">
                <Button icon={XMarkIcon} variant="ghost" shape="circular">Button</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <hr className="border-gray-200" />

    {/* Sizes */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Text Buttons</p>
          <div className="flex gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Icon-only Buttons</p>
          <div className="flex gap-4 items-center">
            <Button icon={HeartIcon} size="sm" aria-label="Like (small)" />
            <Button icon={HeartIcon} size="md" aria-label="Like (medium)" />
            <Button icon={HeartIcon} size="lg" aria-label="Like (large)" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Icon + Text Buttons</p>
          <div className="flex gap-4 items-center">
            <Button icon={CheckIcon} size="sm">Small</Button>
            <Button icon={CheckIcon} size="md">Medium</Button>
            <Button icon={CheckIcon} size="lg">Large</Button>
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    {/* Loading States */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Loading States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Text Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" isLoading>Primary</Button>
            <Button variant="secondary" isLoading>Secondary</Button>
            <Button variant="outline" isLoading>Outline</Button>
            <Button variant="ghost" isLoading>Ghost</Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Icon-only Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={PlayIcon} variant="primary" isLoading aria-label="Loading" />
            <Button icon={HeartIcon} variant="secondary" isLoading aria-label="Loading" />
            <Button icon={StarIcon} variant="outline" isLoading aria-label="Loading" />
            <Button icon={XMarkIcon} variant="ghost" isLoading aria-label="Loading" />
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Icon + Text Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={CheckIcon} variant="primary" isLoading>Saving</Button>
            <Button icon={PlusIcon} variant="secondary" isLoading>Adding</Button>
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    {/* Disabled States */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Disabled States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Text Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" disabled>Primary</Button>
            <Button variant="secondary" disabled>Secondary</Button>
            <Button variant="outline" disabled>Outline</Button>
            <Button variant="ghost" disabled>Ghost</Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Icon-only Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={PlayIcon} variant="primary" disabled aria-label="Play" />
            <Button icon={HeartIcon} variant="secondary" disabled aria-label="Like" />
            <Button icon={StarIcon} variant="outline" disabled aria-label="Favorite" />
            <Button icon={XMarkIcon} variant="ghost" disabled aria-label="Close" />
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Icon + Text Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={CheckIcon} variant="primary" disabled>Save</Button>
            <Button icon={PlusIcon} variant="outline" disabled>Add</Button>
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Width Options</h3>
      <div className="max-w-md flex flex-col items-start gap-3">
        <Button variant="primary">Ok</Button>
        <Button variant="secondary">Adaptive Button Width</Button>
        <Button variant="outline" fullWidth>Full Width</Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Buttons automatically size to content with a minimum width constraint (min-w-20/24/28 for sm/md/lg)
      </p>
    </div>
  
    <hr className="border-gray-200" />

    {/* Common Use Cases */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Common Use Cases</h3>
      <div className="flex flex-col gap-6">
        {/* Form actions */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Form Actions</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary">Submit</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>

        {/* Media controls */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Media Controls</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={PlayIcon} variant="primary" aria-label="Play" />
            <Button icon={PauseIcon} variant="primary" aria-label="Pause" />
            <Button icon={ChevronLeftIcon} variant="ghost" aria-label="Previous" />
            <Button icon={ChevronRightIcon} variant="ghost" aria-label="Next" />
          </div>
        </div>

        {/* Dialog actions */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Dialog Actions</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={XMarkIcon} variant="ghost" shape="square" aria-label="Close dialog" />
            <div className="flex-1" />
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Navigation</p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={ChevronLeftIcon} variant="outline">Back</Button>
            <Button icon={ArrowRightIcon} variant="primary">Continue</Button>
          </div>
        </div>

        {/* Toolbar */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Toolbar</p>
          <div className="flex gap-2">
            <Button icon={Bars3Icon} variant="ghost" aria-label="Menu" />
            <Button icon={MagnifyingGlassIcon} variant="ghost" aria-label="Search" />
            <Button icon={HeartIcon} variant="ghost" aria-label="Favorites" />
            <Button icon={StarIcon} variant="ghost" aria-label="Rate" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

Default.storyName = "Button"
