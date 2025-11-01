import type { Story, StoryDefault } from "@ladle/react";
import { Checkbox } from "./Checkbox";

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Checkbox component showcasing all variants, states, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Inline Labels</h3>
      <div className="flex flex-col gap-3">
        <Checkbox label="I agree to the terms and conditions" />
        <Checkbox label="Subscribe to newsletter" />
        <Checkbox label="Remember me" defaultChecked />
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Registration Form</h3>
      <div className="max-w-md space-y-4">
        <Checkbox label="I have read and agree to the Terms of Service" />
        <Checkbox label="I have read and agree to the Privacy Policy" />
        <Checkbox label="Send me updates about new meditations and content" defaultChecked />
        <Checkbox label="Send me weekly meditation reminders" defaultChecked />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Filter Options</h3>
      <div className="max-w-md">
        <p className="text-sm font-medium mb-3 text-gray-900">Duration:</p>
        <div className="flex flex-col gap-2">
          <Checkbox label="Under 5 minutes" />
          <Checkbox label="5-10 minutes" defaultChecked />
          <Checkbox label="10-20 minutes" defaultChecked />
          <Checkbox label="Over 20 minutes" />
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Checkbox"
