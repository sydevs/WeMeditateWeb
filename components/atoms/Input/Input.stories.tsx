import type { Story, StoryDefault } from "@ladle/react";
import { Input } from "./Input";
import {
  StorySection,
  StoryWrapper,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';
import { HeartIcon } from '@heroicons/react/24/outline';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Input component showcasing all types, width options, and validation states.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Input Types">
      <div className="flex flex-col gap-3 max-w-xs">
        <Input type="text" placeholder="Text input" />
        <Input type="email" placeholder="Email input" />
        <Input type="number" placeholder="Number input" />
        <Input type="tel" placeholder="Phone number" />
        <Input type="url" placeholder="Website URL" />
        <Input type="search" placeholder="Search..." />
        <Input type="date" />
      </div>
    </StorySection>

    <StorySection title="Icon Customization">
      <div className="flex flex-col gap-3 max-w-xs">
        <div>
          <p className="text-sm text-gray-600 mb-1">Custom icon</p>
          <Input type="search" placeholder="Search..." icon={HeartIcon} />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Icon disabled</p>
          <Input type="search" placeholder="Search..." icon={null} />
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
              <Input type="text" placeholder="Normal input" />
            </StoryGridCell>
            <StoryGridCell>
              <Input type="text" placeholder="Normal input" variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Success</StoryGridCell>
            <StoryGridCell>
              <Input type="email" state="success" defaultValue="valid@email.com" />
            </StoryGridCell>
            <StoryGridCell>
              <Input type="email" state="success" defaultValue="valid@email.com" variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Error</StoryGridCell>
            <StoryGridCell>
              <Input type="email" state="error" defaultValue="invalid@email" />
            </StoryGridCell>
            <StoryGridCell>
              <Input type="email" state="error" defaultValue="invalid@email" variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled</StoryGridCell>
            <StoryGridCell>
              <Input type="text" placeholder="Disabled input" disabled />
            </StoryGridCell>
            <StoryGridCell>
              <Input type="text" placeholder="Disabled input" disabled variant="minimal" />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Widths">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default (full width)</p>
          <Input type="text" placeholder="Default width" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Custom Width (max-w-64)</p>
          <Input type="text" placeholder="Custom width" className="max-w-64" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Custom Width (max-w-sm)</p>
          <Input type="text" placeholder="Custom width" className="max-w-sm" />
        </div>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="space-y-6">
        <StorySection title="Search Bar" variant="subsection">
          <div className="max-w-md">
            <Input type="search" placeholder="Search meditations..." className="w-full" />
          </div>
        </StorySection>

        <StorySection title="Login Form" variant="subsection">
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Email</label>
              <Input type="email" placeholder="you@example.com" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Password</label>
              <Input type="password" placeholder="••••••••" className="w-full" />
            </div>
          </div>
        </StorySection>

        <StorySection title="Contact Form" variant="subsection">
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Phone</label>
              <Input type="tel" placeholder="+1 (555) 123-4567" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Website</label>
              <Input type="url" placeholder="https://example.com" className="w-full" />
            </div>
          </div>
        </StorySection>
      </div>
    </StorySection>
  </StoryWrapper>
);
Default.storyName = "Input"
