import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./Button";

export default {
  title: "Atoms / Interactive"
} satisfies StoryDefault;

/**
 * Button component showcasing all variants, sizes, and states.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="text">Text</Button>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Loading</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="secondary" isLoading>Loading</Button>
            <Button variant="outline" isLoading>Loading</Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Disabled</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="outline" disabled>Disabled</Button>
            <Button variant="text" disabled>Disabled</Button>
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Full Width</h3>
      <div className="max-w-md space-y-3">
        <Button variant="primary" fullWidth>Full Width Primary</Button>
        <Button variant="secondary" fullWidth>Full Width Secondary</Button>
        <Button variant="outline" fullWidth>Full Width Outline</Button>
      </div>
    </div>
  </div>
);

Default.storyName = "Button"
