import type { Story, StoryDefault } from '@ladle/react'
import { Input } from './Input'
import {
  StorySection,
  StoryWrapper,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '@/components/ladle'
import { HeartIcon } from '@heroicons/react/24/outline'

export default {
  title: 'Atoms / Form',
} satisfies StoryDefault

/** Input component showcasing all types, width options, and validation states. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Input Types">
      <div className="flex flex-col gap-3 max-w-xs">
        <Input placeholder="Text input" type="text" />
        <Input placeholder="Email input" type="email" />
        <Input placeholder="Number input" type="number" />
        <Input placeholder="Phone number" type="tel" />
        <Input placeholder="Website URL" type="url" />
        <Input placeholder="Search..." type="search" />
        <Input type="date" />
      </div>
    </StorySection>

    <StorySection title="Icon Customization">
      <div className="flex flex-col gap-3 max-w-xs">
        <div>
          <p className="text-sm text-gray-700 mb-1">Custom icon</p>
          <Input icon={HeartIcon} placeholder="Search..." type="search" />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Icon disabled</p>
          <Input icon={null} placeholder="Search..." type="search" />
        </div>
      </div>
    </StorySection>

    <StorySection title="States × Variants">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Default</StoryGridHeaderCell>
            <StoryGridHeaderCell>Minimal</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Default</StoryGridCell>
            <StoryGridCell>
              <Input placeholder="Normal input" type="text" />
            </StoryGridCell>
            <StoryGridCell>
              <Input placeholder="Normal input" type="text" variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Success</StoryGridCell>
            <StoryGridCell>
              <Input defaultValue="valid@email.com" state="success" type="email" />
            </StoryGridCell>
            <StoryGridCell>
              <Input
                defaultValue="valid@email.com"
                state="success"
                type="email"
                variant="minimal"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Error</StoryGridCell>
            <StoryGridCell>
              <Input defaultValue="invalid@email" state="error" type="email" />
            </StoryGridCell>
            <StoryGridCell>
              <Input defaultValue="invalid@email" state="error" type="email" variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled</StoryGridCell>
            <StoryGridCell>
              <Input disabled placeholder="Disabled input" type="text" />
            </StoryGridCell>
            <StoryGridCell>
              <Input disabled placeholder="Disabled input" type="text" variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Widths">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-700 mb-1">Default (full width)</p>
          <Input placeholder="Default width" type="text" />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Custom Width (max-w-64)</p>
          <Input className="max-w-64" placeholder="Custom width" type="text" />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Custom Width (max-w-sm)</p>
          <Input className="max-w-sm" placeholder="Custom width" type="text" />
        </div>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="space-y-6">
        <StorySection title="Search Bar" variant="subsection">
          <div className="max-w-md">
            <Input className="w-full" placeholder="Search meditations..." type="search" />
          </div>
        </StorySection>

        <StorySection title="Login Form" variant="subsection">
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Email</label>
              <Input className="w-full" placeholder="you@example.com" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Password</label>
              <Input className="w-full" placeholder="••••••••" type="password" />
            </div>
          </div>
        </StorySection>

        <StorySection title="Contact Form" variant="subsection">
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Phone</label>
              <Input className="w-full" placeholder="+1 (555) 123-4567" type="tel" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Website</label>
              <Input className="w-full" placeholder="https://example.com" type="url" />
            </div>
          </div>
        </StorySection>
      </div>
    </StorySection>
  </StoryWrapper>
)
Default.storyName = 'Input'
