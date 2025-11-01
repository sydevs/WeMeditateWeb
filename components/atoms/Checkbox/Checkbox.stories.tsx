import type { Story, StoryDefault } from "@ladle/react";
import { Checkbox } from "./Checkbox";

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Checkbox component showcasing all variants and states.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Colors</h3>
      <div className="flex flex-col gap-3">
        <Checkbox label="Primary (default)" defaultChecked />
        <Checkbox label="Secondary" color="secondary" defaultChecked />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div className="flex flex-col gap-3">
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Disabled unchecked" disabled />
        <Checkbox label="Disabled checked" disabled defaultChecked />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Without Labels</h3>
      <div className="flex gap-3 items-center">
        <Checkbox aria-label="Checkbox 1" />
        <Checkbox aria-label="Checkbox 2" defaultChecked />
        <Checkbox aria-label="Checkbox 3" />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Grouped Checkboxes</h3>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-900">Select your interests:</p>
        <div className="flex flex-col gap-2">
          <Checkbox label="Meditation Techniques" defaultChecked />
          <Checkbox label="Guided Meditations" defaultChecked />
          <Checkbox label="Meditation Music" />
          <Checkbox label="Articles & Philosophy" />
          <Checkbox label="Events & Workshops" />
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Checkbox"
