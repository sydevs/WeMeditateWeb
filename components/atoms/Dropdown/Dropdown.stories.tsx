import type { Story, StoryDefault } from '@ladle/react'
import { Dropdown, DropdownItem } from './Dropdown'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { StorySection, StoryWrapper } from '../../ladle'
import {
  GlobeAltIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'

export default {
  title: 'Atoms / Form',
} satisfies StoryDefault

/**
 * Dropdown component for creating accessible dropdown menus with keyboard support.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex flex-col gap-8">
        <StorySection title="Small" variant="subsection">
          <Dropdown size="sm" trigger={<Button variant="secondary">Small Dropdown</Button>}>
            <DropdownItem href="#" size="sm">
              Menu Item 1
            </DropdownItem>
            <DropdownItem href="#" size="sm">
              Menu Item 2
            </DropdownItem>
            <DropdownItem href="#" size="sm">
              Menu Item 3
            </DropdownItem>
          </Dropdown>
        </StorySection>

        <StorySection title="Medium (Default)" variant="subsection">
          <Dropdown size="md" trigger={<Button variant="secondary">Medium Dropdown</Button>}>
            <DropdownItem href="#" size="md">
              Menu Item 1
            </DropdownItem>
            <DropdownItem href="#" size="md">
              Menu Item 2
            </DropdownItem>
            <DropdownItem href="#" size="md">
              Menu Item 3
            </DropdownItem>
          </Dropdown>
        </StorySection>

        <StorySection title="Large" variant="subsection">
          <Dropdown size="lg" trigger={<Button variant="secondary">Large Dropdown</Button>}>
            <DropdownItem href="#" size="lg">
              Menu Item 1
            </DropdownItem>
            <DropdownItem href="#" size="lg">
              Menu Item 2
            </DropdownItem>
            <DropdownItem href="#" size="lg">
              Menu Item 3
            </DropdownItem>
          </Dropdown>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Basic Dropdown">
      <div className="flex flex-col gap-8">
        <StorySection title="With Button Trigger" variant="subsection">
          <Dropdown trigger={<Button variant="secondary">Open Menu</Button>}>
            <DropdownItem href="#">Menu Item 1</DropdownItem>
            <DropdownItem href="#">Menu Item 2</DropdownItem>
            <DropdownItem href="#">Menu Item 3</DropdownItem>
          </Dropdown>
        </StorySection>

        <StorySection title="With Icon Trigger" variant="subsection">
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Icon icon={GlobeAltIcon} size="sm" />
                <span className="text-sm">Options</span>
              </button>
            }
          >
            <DropdownItem href="#">Option 1</DropdownItem>
            <DropdownItem href="#">Option 2</DropdownItem>
          </Dropdown>
        </StorySection>

        <StorySection title="With Text Trigger" variant="subsection">
          <Dropdown
            trigger={
              <span className="text-gray-600 hover:text-gray-900 cursor-pointer text-sm">
                Click me ▼
              </span>
            }
          >
            <DropdownItem href="#">Item A</DropdownItem>
            <DropdownItem href="#">Item B</DropdownItem>
            <DropdownItem href="#">Item C</DropdownItem>
          </Dropdown>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Alignment">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned (Default)" variant="subsection">
          <Dropdown align="left" trigger={<Button variant="secondary">Left Aligned</Button>}>
            <DropdownItem href="#">This dropdown opens to the left</DropdownItem>
            <DropdownItem href="#">Perfect for left-side triggers</DropdownItem>
          </Dropdown>
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <div className="flex justify-end">
            <Dropdown align="right" trigger={<Button variant="secondary">Right Aligned</Button>}>
              <DropdownItem href="#">This dropdown opens to the right</DropdownItem>
              <DropdownItem href="#">Perfect for right-side triggers</DropdownItem>
            </Dropdown>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Placement">
      <p className="mb-6 max-w-prose text-sm text-gray-600">
        The panel opens on <code>side</code> and automatically <strong>flips</strong> to the
        opposite side and <strong>shifts</strong> along the cross-axis to stay within the viewport
        (open one near a screen edge to see it). Positioning is handled by Floating UI, and the
        panel is portaled so it is never clipped by an ancestor&rsquo;s overflow.
      </p>
      <div className="flex flex-wrap gap-8">
        {(['bottom', 'top', 'left', 'right'] as const).map((side) => (
          <StorySection key={side} title={`side="${side}"`} variant="subsection">
            <Dropdown
              align="center"
              side={side}
              trigger={<Button variant="secondary">Open {side}</Button>}
            >
              <DropdownItem href="#">Menu Item 1</DropdownItem>
              <DropdownItem href="#">Menu Item 2</DropdownItem>
            </Dropdown>
          </StorySection>
        ))}
      </div>
    </StorySection>

    <StorySection title="Dialog panel">
      <p className="mb-6 max-w-prose text-sm text-gray-600">
        With <code>role=&quot;dialog&quot;</code> the panel holds rich, non-menu content (as the
        meditation player&rsquo;s audio controls do). Pair it with <code>ariaLabel</code> so the
        popover is announced.
      </p>
      <Dropdown
        align="center"
        ariaLabel="Display settings"
        role="dialog"
        side="top"
        trigger={
          <Button icon={Cog6ToothIcon} variant="secondary">
            Settings
          </Button>
        }
      >
        <div className="flex w-64 flex-col gap-3 p-4 text-left">
          <p className="text-sm font-medium text-gray-700">Display options</p>
          <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
            Brightness
            <input
              aria-label="Brightness"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-300 accent-teal-600"
              max="1"
              min="0"
              step="0.01"
              type="range"
            />
          </label>
        </div>
      </Dropdown>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700">User Menu</h3>
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                <Icon icon={UserIcon} size="sm" />
                <span className="text-sm">John Doe</span>
                <Icon icon={ChevronDownIcon} size="xs" />
              </button>
            }
          >
            <DropdownItem className="flex items-center gap-2" href="#">
              <Icon icon={UserIcon} size="sm" />
              Profile
            </DropdownItem>
            <DropdownItem className="flex items-center gap-2" href="#">
              <Icon icon={Cog6ToothIcon} size="sm" />
              Settings
            </DropdownItem>
            <hr className="my-2" />
            <DropdownItem className="flex items-center gap-2 text-error" href="#">
              <Icon icon={ArrowRightStartOnRectangleIcon} size="sm" />
              Logout
            </DropdownItem>
          </Dropdown>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Action Menu</h3>
          <Dropdown
            trigger={
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Icon icon={EllipsisVerticalIcon} size="sm" />
              </button>
            }
          >
            <DropdownItem href="#">Edit</DropdownItem>
            <DropdownItem href="#">Duplicate</DropdownItem>
            <DropdownItem href="#">Archive</DropdownItem>
            <hr className="my-2" />
            <DropdownItem className="text-error" href="#">
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Dropdown'
