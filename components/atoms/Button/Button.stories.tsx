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
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Unified Button component showcasing all variants, sizes, shapes, and use cases.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell colSpan={2}>Icon</StoryGridHeaderCell>
            <StoryGridHeaderCell colSpan={2}>Icon & Text</StoryGridHeaderCell>
          </StoryGridHeaderRow>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell size="secondary" />
            <StoryGridHeaderCell size="secondary">Square</StoryGridHeaderCell>
            <StoryGridHeaderCell size="secondary">Circular</StoryGridHeaderCell>
            <StoryGridHeaderCell size="secondary">Square</StoryGridHeaderCell>
            <StoryGridHeaderCell size="secondary">Circular</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Primary</StoryGridCell>
            <StoryGridCell>
              <Button icon={PlayIcon} variant="primary" shape="square" aria-label="Play" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={PlayIcon} variant="primary" shape="circular" aria-label="Play" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={PlayIcon} variant="primary" shape="square">Button</Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={PlayIcon} variant="primary" shape="circular">Button</Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Secondary</StoryGridCell>
            <StoryGridCell>
              <Button icon={HeartIcon} variant="secondary" shape="square" aria-label="Like" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={HeartIcon} variant="secondary" shape="circular" aria-label="Like" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={HeartIcon} variant="secondary" shape="square">Button</Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={HeartIcon} variant="secondary" shape="circular">Button</Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Outline</StoryGridCell>
            <StoryGridCell>
              <Button icon={StarIcon} variant="outline" shape="square" aria-label="Favorite" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={StarIcon} variant="outline" shape="circular" aria-label="Favorite" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={StarIcon} variant="outline" shape="square">Button</Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={StarIcon} variant="outline" shape="circular">Button</Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Ghost</StoryGridCell>
            <StoryGridCell>
              <Button icon={XMarkIcon} variant="ghost" shape="square" aria-label="Close" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={XMarkIcon} variant="ghost" shape="circular" aria-label="Close" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={XMarkIcon} variant="ghost" shape="square">Button</Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={XMarkIcon} variant="ghost" shape="circular">Button</Button>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection
      title="Dark Theme"
      theme="dark"
      background="neutral"
      description="All button variants on dark backgrounds - outline and ghost use white, primary and secondary remain vibrant"
    >
      <div className="flex gap-4 items-center flex-wrap">
        <Button variant="primary" theme="dark" icon={PlayIcon} aria-label="Play" />
        <Button variant="primary" theme="dark">Primary</Button>
        <Button variant="secondary" theme="dark" icon={HeartIcon} aria-label="Like" />
        <Button variant="secondary" theme="dark">Secondary</Button>
        <Button variant="outline" theme="dark" icon={StarIcon} aria-label="Favorite" />
        <Button variant="outline" theme="dark">Outline</Button>
        <Button variant="ghost" theme="dark" icon={XMarkIcon} aria-label="Close" />
        <Button variant="ghost" theme="dark">Ghost</Button>
      </div>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex flex-col gap-6">
        <StorySection title="Text Buttons" variant="subsection">
          <div className="flex gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </StorySection>
        <StorySection title="Icon-only Buttons" variant="subsection">
          <div className="flex gap-4 items-center">
            <Button icon={HeartIcon} size="sm" aria-label="Like (small)" />
            <Button icon={HeartIcon} size="md" aria-label="Like (medium)" />
            <Button icon={HeartIcon} size="lg" aria-label="Like (large)" />
          </div>
        </StorySection>
        <StorySection title="Icon + Text Buttons" variant="subsection">
          <div className="flex gap-4 items-center">
            <Button icon={CheckIcon} size="sm">Small</Button>
            <Button icon={CheckIcon} size="md">Medium</Button>
            <Button icon={CheckIcon} size="lg">Large</Button>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="States">
      <div className="flex flex-col gap-6">
        <StorySection title="Loading" variant="subsection">
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
        </StorySection>

        <StorySection title="Disabled" variant="subsection">
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
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Widths">
      <div className="max-w-md flex flex-col items-start gap-3">
        <Button variant="primary">Ok</Button>
        <Button variant="secondary">Adaptive Button Width</Button>
        <Button variant="outline" fullWidth>Full Width</Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Buttons automatically size to content with a minimum width constraint (min-w-20/24/28 for sm/md/lg)
      </p>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-6">
        <StorySection title="Call-to-Action on Light Background (wemeditate.com style)" variant="subsection">
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" size="lg">Meditate Now</Button>
            <Button variant="outline" size="lg">Learn More</Button>
            <Button variant="outline" size="lg">Discover My Sound</Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Hover to see the animated background fill from center to edges
          </p>
        </StorySection>

        <StorySection title="Call-to-Action on Dark Background (wemeditate.com style)" variant="subsection">
          <div className="bg-gray-900 p-6 rounded">
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" theme="dark" size="lg">Get Inspired</Button>
              <Button variant="outline" theme="dark" size="lg">Start Today</Button>
              <Button variant="outline" theme="dark" size="lg">Join Now</Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            White variant with animated hover effect for dark backgrounds
          </p>
        </StorySection>

        <StorySection title="Form Actions" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary">Submit</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </StorySection>

        <StorySection title="Media Controls" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button icon={PlayIcon} variant="primary" aria-label="Play" />
            <Button icon={PauseIcon} variant="primary" aria-label="Pause" />
            <Button icon={ChevronLeftIcon} variant="ghost" aria-label="Previous" />
            <Button icon={ChevronRightIcon} variant="ghost" aria-label="Next" />
          </div>
        </StorySection>

        <StorySection title="Dialog Actions" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button icon={XMarkIcon} variant="ghost" shape="square" aria-label="Close dialog" />
            <div className="flex-1" />
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </div>
        </StorySection>

        <StorySection title="Navigation" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button icon={ChevronLeftIcon} variant="outline">Back</Button>
            <Button icon={ArrowRightIcon} variant="primary">Continue</Button>
          </div>
        </StorySection>

        <StorySection title="Toolbar" variant="subsection">
          <div className="flex gap-2">
            <Button icon={Bars3Icon} variant="ghost" aria-label="Menu" />
            <Button icon={MagnifyingGlassIcon} variant="ghost" aria-label="Search" />
            <Button icon={HeartIcon} variant="ghost" aria-label="Favorites" />
            <Button icon={StarIcon} variant="ghost" aria-label="Rate" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Button"
