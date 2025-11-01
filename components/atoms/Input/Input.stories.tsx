import type { Story, StoryDefault } from "@ladle/react";
import { Input } from "./Input";

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Input component showcasing all types, width options, and validation states.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Input Types</h3>
      <div className="flex flex-col gap-3">
        <Input type="text" placeholder="Text input" />
        <Input type="email" placeholder="Email input" />
        <Input type="number" placeholder="Number input" />
        <Input type="tel" placeholder="Phone number" />
        <Input type="url" placeholder="Website URL" />
        <Input type="search" placeholder="Search..." />
        <Input type="date" />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
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
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Width Options</h3>
      <div className="flex flex-col items-start gap-3">
        <Input type="text" placeholder="Default width" />
        <Input type="text" placeholder="Full width" fullWidth />
      </div>
    </div>
  </div>
);
Default.storyName = "Input"
