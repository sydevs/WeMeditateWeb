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
          <Dropdown trigger={<Button variant="secondary">Small Dropdown</Button>} size="sm">
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
          <Dropdown trigger={<Button variant="secondary">Medium Dropdown</Button>} size="md">
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
          <Dropdown trigger={<Button variant="secondary">Large Dropdown</Button>} size="lg">
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
          <Dropdown trigger={<Button variant="secondary">Left Aligned</Button>} align="left">
            <DropdownItem href="#">This dropdown opens to the left</DropdownItem>
            <DropdownItem href="#">Perfect for left-side triggers</DropdownItem>
          </Dropdown>
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <div className="flex justify-end">
            <Dropdown trigger={<Button variant="secondary">Right Aligned</Button>} align="right">
              <DropdownItem href="#">This dropdown opens to the right</DropdownItem>
              <DropdownItem href="#">Perfect for right-side triggers</DropdownItem>
            </Dropdown>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700">User Menu</h3>
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                <Icon icon={UserIcon} size="sm" />
                <span className="text-sm">John Doe</span>
                <Icon icon={ChevronDownIcon} size="xs" />
              </button>
            }
            align="right"
          >
            <DropdownItem href="#" className="flex items-center gap-2">
              <Icon icon={UserIcon} size="sm" />
              Profile
            </DropdownItem>
            <DropdownItem href="#" className="flex items-center gap-2">
              <Icon icon={Cog6ToothIcon} size="sm" />
              Settings
            </DropdownItem>
            <hr className="my-2" />
            <DropdownItem href="#" className="flex items-center gap-2 text-error">
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
            <DropdownItem href="#" className="text-error">
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
