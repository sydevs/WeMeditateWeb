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
  StoryExampleSection,
  StorySubsection,
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

    <StorySection title="Sizes">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Text Buttons">
          <div className="flex gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </StorySubsection>
        <StorySubsection label="Icon-only Buttons">
          <div className="flex gap-4 items-center">
            <Button icon={HeartIcon} size="sm" aria-label="Like (small)" />
            <Button icon={HeartIcon} size="md" aria-label="Like (medium)" />
            <Button icon={HeartIcon} size="lg" aria-label="Like (large)" />
          </div>
        </StorySubsection>
        <StorySubsection label="Icon + Text Buttons">
          <div className="flex gap-4 items-center">
            <Button icon={CheckIcon} size="sm">Small</Button>
            <Button icon={CheckIcon} size="md">Medium</Button>
            <Button icon={CheckIcon} size="lg">Large</Button>
          </div>
        </StorySubsection>
      </div>
    </StorySection>

    <StorySection title="States">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Loading">
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
        </StorySubsection>

        <StorySubsection label="Disabled">
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
        </StorySubsection>
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

    <StoryExampleSection>
      <div className="flex flex-col gap-6">
        <StorySubsection label="Form Actions">
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary">Submit</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </StorySubsection>

        <StorySubsection label="Media Controls">
          <div className="flex gap-3 flex-wrap">
            <Button icon={PlayIcon} variant="primary" aria-label="Play" />
            <Button icon={PauseIcon} variant="primary" aria-label="Pause" />
            <Button icon={ChevronLeftIcon} variant="ghost" aria-label="Previous" />
            <Button icon={ChevronRightIcon} variant="ghost" aria-label="Next" />
          </div>
        </StorySubsection>

        <StorySubsection label="Dialog Actions">
          <div className="flex gap-3 flex-wrap">
            <Button icon={XMarkIcon} variant="ghost" shape="square" aria-label="Close dialog" />
            <div className="flex-1" />
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </div>
        </StorySubsection>

        <StorySubsection label="Navigation">
          <div className="flex gap-3 flex-wrap">
            <Button icon={ChevronLeftIcon} variant="outline">Back</Button>
            <Button icon={ArrowRightIcon} variant="primary">Continue</Button>
          </div>
        </StorySubsection>

        <StorySubsection label="Toolbar">
          <div className="flex gap-2">
            <Button icon={Bars3Icon} variant="ghost" aria-label="Menu" />
            <Button icon={MagnifyingGlassIcon} variant="ghost" aria-label="Search" />
            <Button icon={HeartIcon} variant="ghost" aria-label="Favorites" />
            <Button icon={StarIcon} variant="ghost" aria-label="Rate" />
          </div>
        </StorySubsection>
      </div>
    </StoryExampleSection>

    {/* Remove the trailing divider from the last section */}
    <div />
  </StoryWrapper>
);

Default.storyName = "Button"
