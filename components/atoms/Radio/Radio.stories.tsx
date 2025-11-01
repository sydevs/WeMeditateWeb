import type { Story } from "@ladle/react";
import { Radio } from "./Radio";

/**
 * Radio component showcasing groups and labels.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Radio Group with Labels</h3>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-900">Select your experience level:</p>
        <div className="flex flex-col gap-2">
          <Radio name="experience" value="beginner" label="Beginner" defaultChecked />
          <Radio name="experience" value="intermediate" label="Intermediate" />
          <Radio name="experience" value="advanced" label="Advanced" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Without Inline Labels</h3>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-900">Choose an option:</p>
        <div className="flex gap-3">
          <Radio name="options" value="1" aria-label="Option 1" defaultChecked />
          <Radio name="options" value="2" aria-label="Option 2" />
          <Radio name="options" value="3" aria-label="Option 3" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Multiple Groups</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Meditation duration:</p>
          <div className="flex flex-col gap-2">
            <Radio name="duration" value="5" label="5 minutes" />
            <Radio name="duration" value="10" label="10 minutes" defaultChecked />
            <Radio name="duration" value="20" label="20 minutes" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Preferred time:</p>
          <div className="flex flex-col gap-2">
            <Radio name="time" value="morning" label="Morning" defaultChecked />
            <Radio name="time" value="afternoon" label="Afternoon" />
            <Radio name="time" value="evening" label="Evening" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Radio states including disabled.
 */
export const States: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Disabled State</h3>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-900">Options:</p>
        <div className="flex flex-col gap-2">
          <Radio name="disabled" value="1" label="Disabled unchecked" disabled />
          <Radio name="disabled" value="2" label="Disabled checked" disabled defaultChecked />
          <Radio name="disabled" value="3" label="Active option" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-900">Current state:</p>
        <div className="flex flex-col gap-2">
          <Radio name="states" value="unchecked" label="Unchecked" />
          <Radio name="states" value="checked" label="Checked" defaultChecked />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Radio in form context.
 */
export const InContext: Story = () => (
  <div className="max-w-md flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Survey Form</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-900">
            How often do you meditate?
          </label>
          <div className="flex flex-col gap-2">
            <Radio name="frequency" value="daily" label="Daily" defaultChecked />
            <Radio name="frequency" value="weekly" label="A few times a week" />
            <Radio name="frequency" value="monthly" label="A few times a month" />
            <Radio name="frequency" value="rarely" label="Rarely" />
            <Radio name="frequency" value="never" label="Never" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3 text-gray-900">
            What is your primary goal?
          </label>
          <div className="flex flex-col gap-2">
            <Radio name="goal" value="stress" label="Stress relief" defaultChecked />
            <Radio name="goal" value="focus" label="Better focus and concentration" />
            <Radio name="goal" value="sleep" label="Improved sleep" />
            <Radio name="goal" value="mindfulness" label="Mindfulness and awareness" />
            <Radio name="goal" value="spiritual" label="Spiritual growth" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
