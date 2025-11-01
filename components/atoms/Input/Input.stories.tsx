import type { Story, StoryDefault } from "@ladle/react";
import { Input } from "./Input";
import { StorySection, StorySubsection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Input component showcasing all types, width options, and validation states.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Input Types">
      <div className="flex flex-col gap-3">
        <Input type="text" placeholder="Text input" />
        <Input type="email" placeholder="Email input" />
        <Input type="number" placeholder="Number input" />
        <Input type="tel" placeholder="Phone number" />
        <Input type="url" placeholder="Website URL" />
        <Input type="search" placeholder="Search..." />
        <Input type="date" />
      </div>
    </StorySection>

    <StorySection title="States">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default</p>
          <Input type="text" placeholder="Normal input" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Success</p>
          <Input
            type="email"
            state="success"
            defaultValue="valid@email.com"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Error</p>
          <Input
            type="email"
            state="error"
            defaultValue="invalid@email"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Disabled</p>
          <Input type="text" placeholder="Disabled input" disabled />
        </div>
      </div>
    </StorySection>

    <StorySection title="Widths">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default (256px / w-64)</p>
          <Input type="text" placeholder="Default width" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Full Width</p>
          <Input type="text" placeholder="Full width" fullWidth />
        </div>
      </div>
    </StorySection>

    <StorySection title="Examples">
      <div className="space-y-4">
        <StorySubsection label="Login Form">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Email</label>
              <Input type="email" placeholder="you@example.com" fullWidth />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Password</label>
              <Input type="password" placeholder="••••••••" fullWidth />
            </div>
          </div>
        </StorySubsection>
      </div>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
Default.storyName = "Input"
