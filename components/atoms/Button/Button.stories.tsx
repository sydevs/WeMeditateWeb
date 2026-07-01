import type { Story, StoryDefault } from '@ladle/react'
import { Button } from './Button'
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
  StoryGridCell,
} from '../../ladle'

export default {
  title: 'Atoms',
} satisfies StoryDefault

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
              <Button aria-label="Play" icon={PlayIcon} shape="square" variant="primary" />
            </StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Play" icon={PlayIcon} shape="circular" variant="primary" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={PlayIcon} shape="square" variant="primary">
                Button
              </Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={PlayIcon} shape="circular" variant="primary">
                Button
              </Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Secondary</StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Like" icon={HeartIcon} shape="square" variant="secondary" />
            </StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Like" icon={HeartIcon} shape="circular" variant="secondary" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={HeartIcon} shape="square" variant="secondary">
                Button
              </Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={HeartIcon} shape="circular" variant="secondary">
                Button
              </Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Neutral</StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Confirm" icon={CheckIcon} shape="square" variant="neutral" />
            </StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Confirm" icon={CheckIcon} shape="circular" variant="neutral" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={CheckIcon} shape="square" variant="neutral">
                Button
              </Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={CheckIcon} shape="circular" variant="neutral">
                Button
              </Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Outline</StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Favorite" icon={StarIcon} shape="square" variant="outline" />
            </StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Favorite" icon={StarIcon} shape="circular" variant="outline" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={StarIcon} shape="square" variant="outline">
                Button
              </Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={StarIcon} shape="circular" variant="outline">
                Button
              </Button>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Ghost</StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Close" icon={XMarkIcon} shape="square" variant="ghost" />
            </StoryGridCell>
            <StoryGridCell>
              <Button aria-label="Close" icon={XMarkIcon} shape="circular" variant="ghost" />
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={XMarkIcon} shape="square" variant="ghost">
                Button
              </Button>
            </StoryGridCell>
            <StoryGridCell>
              <Button icon={XMarkIcon} shape="circular" variant="ghost">
                Button
              </Button>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection
      background="neutral"
      description="All button variants on dark backgrounds - outline and ghost use white, primary and secondary remain vibrant"
      theme="dark"
      title="Dark Theme"
    >
      <div className="flex gap-4 items-center flex-wrap">
        <Button aria-label="Play" icon={PlayIcon} theme="dark" variant="primary" />
        <Button theme="dark" variant="primary">
          Primary
        </Button>
        <Button aria-label="Like" icon={HeartIcon} theme="dark" variant="secondary" />
        <Button theme="dark" variant="secondary">
          Secondary
        </Button>
        <Button aria-label="Confirm" icon={CheckIcon} theme="dark" variant="neutral" />
        <Button theme="dark" variant="neutral">
          Neutral
        </Button>
        <Button aria-label="Favorite" icon={StarIcon} theme="dark" variant="outline" />
        <Button theme="dark" variant="outline">
          Outline
        </Button>
        <Button aria-label="Close" icon={XMarkIcon} theme="dark" variant="ghost" />
        <Button theme="dark" variant="ghost">
          Ghost
        </Button>
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
            <Button aria-label="Like (small)" icon={HeartIcon} size="sm" />
            <Button aria-label="Like (medium)" icon={HeartIcon} size="md" />
            <Button aria-label="Like (large)" icon={HeartIcon} size="lg" />
          </div>
        </StorySection>
        <StorySection title="Icon + Text Buttons" variant="subsection">
          <div className="flex gap-4 items-center">
            <Button icon={CheckIcon} size="sm">
              Small
            </Button>
            <Button icon={CheckIcon} size="md">
              Medium
            </Button>
            <Button icon={CheckIcon} size="lg">
              Large
            </Button>
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
                <Button isLoading variant="primary">
                  Primary
                </Button>
                <Button isLoading variant="secondary">
                  Secondary
                </Button>
                <Button isLoading variant="outline">
                  Outline
                </Button>
                <Button isLoading variant="ghost">
                  Ghost
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Icon-only Buttons</p>
              <div className="flex gap-3 flex-wrap">
                <Button isLoading aria-label="Loading" icon={PlayIcon} variant="primary" />
                <Button isLoading aria-label="Loading" icon={HeartIcon} variant="secondary" />
                <Button isLoading aria-label="Loading" icon={StarIcon} variant="outline" />
                <Button isLoading aria-label="Loading" icon={XMarkIcon} variant="ghost" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Icon + Text Buttons</p>
              <div className="flex gap-3 flex-wrap">
                <Button isLoading icon={CheckIcon} variant="primary">
                  Saving
                </Button>
                <Button isLoading icon={PlusIcon} variant="secondary">
                  Adding
                </Button>
              </div>
            </div>
          </div>
        </StorySection>

        <StorySection title="Disabled" variant="subsection">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Text Buttons</p>
              <div className="flex gap-3 flex-wrap">
                <Button disabled variant="primary">
                  Primary
                </Button>
                <Button disabled variant="secondary">
                  Secondary
                </Button>
                <Button disabled variant="outline">
                  Outline
                </Button>
                <Button disabled variant="ghost">
                  Ghost
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Icon-only Buttons</p>
              <div className="flex gap-3 flex-wrap">
                <Button disabled aria-label="Play" icon={PlayIcon} variant="primary" />
                <Button disabled aria-label="Like" icon={HeartIcon} variant="secondary" />
                <Button disabled aria-label="Favorite" icon={StarIcon} variant="outline" />
                <Button disabled aria-label="Close" icon={XMarkIcon} variant="ghost" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Icon + Text Buttons</p>
              <div className="flex gap-3 flex-wrap">
                <Button disabled icon={CheckIcon} variant="primary">
                  Save
                </Button>
                <Button disabled icon={PlusIcon} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Active">
      <div className="flex flex-col gap-6">
        <StorySection title="Ghost on Light Background" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button isActive href="#" variant="ghost">
              Meditate Now
            </Button>
            <Button href="#" variant="ghost">
              Music for Meditation
            </Button>
            <Button href="#" variant="ghost">
              Inspiration
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The active link keeps a persistent tinted fill and carries aria-current="page"
          </p>
        </StorySection>

        <StorySection title="Ghost on Dark Background" variant="subsection">
          <div className="bg-gray-900 p-6 rounded">
            <div className="flex gap-3 flex-wrap">
              <Button isActive href="#" theme="dark" variant="ghost">
                Meditate Now
              </Button>
              <Button href="#" theme="dark" variant="ghost">
                Music for Meditation
              </Button>
              <Button href="#" theme="dark" variant="ghost">
                Inspiration
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The active tint is theme-aware — a lighter fill for dark (splash-overlay) headers
          </p>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Widths">
      <div className="max-w-md flex flex-col items-start gap-3">
        <Button variant="primary">Ok</Button>
        <Button variant="secondary">Adaptive Button Width</Button>
        <Button fullWidth variant="outline">
          Full Width
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Buttons automatically size to content with a minimum width constraint (min-w-20/24/28 for
        sm/md/lg)
      </p>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex flex-col gap-6">
        <StorySection
          title="Call-to-Action on Light Background (wemeditate.com style)"
          variant="subsection"
        >
          <div className="flex gap-4 flex-wrap">
            <Button size="lg" variant="outline">
              Meditate Now
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
            <Button size="lg" variant="outline">
              Discover My Sound
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Hover to see the animated background fill from center to edges
          </p>
        </StorySection>

        <StorySection
          title="Call-to-Action on Dark Background (wemeditate.com style)"
          variant="subsection"
        >
          <div className="bg-gray-900 p-6 rounded">
            <div className="flex gap-4 flex-wrap">
              <Button size="lg" theme="dark" variant="outline">
                Get Inspired
              </Button>
              <Button size="lg" theme="dark" variant="outline">
                Start Today
              </Button>
              <Button size="lg" theme="dark" variant="outline">
                Join Now
              </Button>
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
            <Button aria-label="Play" icon={PlayIcon} variant="primary" />
            <Button aria-label="Pause" icon={PauseIcon} variant="primary" />
            <Button aria-label="Previous" icon={ChevronLeftIcon} variant="ghost" />
            <Button aria-label="Next" icon={ChevronRightIcon} variant="ghost" />
          </div>
        </StorySection>

        <StorySection title="Dialog Actions" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button aria-label="Close dialog" icon={XMarkIcon} shape="square" variant="ghost" />
            <div className="flex-1" />
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </div>
        </StorySection>

        <StorySection title="Navigation" variant="subsection">
          <div className="flex gap-3 flex-wrap">
            <Button icon={ChevronLeftIcon} variant="outline">
              Back
            </Button>
            <Button icon={ArrowRightIcon} variant="primary">
              Continue
            </Button>
          </div>
        </StorySection>

        <StorySection title="Toolbar" variant="subsection">
          <div className="flex gap-2">
            <Button aria-label="Menu" icon={Bars3Icon} variant="ghost" />
            <Button aria-label="Search" icon={MagnifyingGlassIcon} variant="ghost" />
            <Button aria-label="Favorites" icon={HeartIcon} variant="ghost" />
            <Button aria-label="Rate" icon={StarIcon} variant="ghost" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Button'
