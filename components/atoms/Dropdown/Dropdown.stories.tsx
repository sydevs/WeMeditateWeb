import type { Story, StoryDefault } from '@ladle/react'
import { Dropdown } from './Dropdown'
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
    <StorySection title="Basic Dropdown">
      <div className="flex flex-col gap-8">
        <StorySection title="With Button Trigger" variant="subsection">
          <Dropdown trigger={<Button variant="secondary">Open Menu</Button>}>
            <div className="flex flex-col">
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Menu Item 1
              </a>
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Menu Item 2
              </a>
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Menu Item 3
              </a>
            </div>
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
            <div className="flex flex-col">
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Option 1
              </a>
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Option 2
              </a>
            </div>
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
            <div className="flex flex-col py-2">
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Item A
              </a>
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Item B
              </a>
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Item C
              </a>
            </div>
          </Dropdown>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Alignment">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned (Default)" variant="subsection">
          <Dropdown trigger={<Button variant="secondary">Left Aligned</Button>} align="left">
            <div className="flex flex-col py-2">
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                This dropdown opens to the left
              </a>
              <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                Perfect for left-side triggers
              </a>
            </div>
          </Dropdown>
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <div className="flex justify-end">
            <Dropdown trigger={<Button variant="secondary">Right Aligned</Button>} align="right">
              <div className="flex flex-col py-2">
                <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                  This dropdown opens to the right
                </a>
                <a href="#" className="px-4 py-2 hover:bg-gray-100 text-sm">
                  Perfect for right-side triggers
                </a>
              </div>
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
            <div className="flex flex-col py-2">
              <a href="#" className="px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2">
                <Icon icon={UserIcon} size="sm" />
                Profile
              </a>
              <a href="#" className="px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2">
                <Icon icon={Cog6ToothIcon} size="sm" />
                Settings
              </a>
              <hr className="my-2" />
              <a href="#" className="px-4 py-3 hover:bg-gray-100 text-sm text-error flex items-center gap-2">
                <Icon icon={ArrowRightStartOnRectangleIcon} size="sm" />
                Logout
              </a>
            </div>
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
            <div className="flex flex-col py-2">
              <button className="px-4 py-2 hover:bg-gray-100 text-sm text-left">Edit</button>
              <button className="px-4 py-2 hover:bg-gray-100 text-sm text-left">Duplicate</button>
              <button className="px-4 py-2 hover:bg-gray-100 text-sm text-left">Archive</button>
              <hr className="my-2" />
              <button className="px-4 py-2 hover:bg-gray-100 text-sm text-error text-left">Delete</button>
            </div>
          </Dropdown>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Dropdown'
