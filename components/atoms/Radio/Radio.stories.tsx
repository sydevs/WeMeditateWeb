import type { Story, StoryDefault } from "@ladle/react";
import { Radio } from "./Radio";

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Radio component showcasing all variants and states.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Colors</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Primary (default):</p>
          <div className="flex flex-col gap-2">
            <Radio name="primary" value="1" label="Option 1" defaultChecked />
            <Radio name="primary" value="2" label="Option 2" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Secondary:</p>
          <div className="flex flex-col gap-2">
            <Radio name="secondary" value="1" label="Option 1" color="secondary" defaultChecked />
            <Radio name="secondary" value="2" label="Option 2" color="secondary" />
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-900">Options:</p>
        <div className="flex flex-col gap-2">
          <Radio name="states" value="unchecked" label="Unchecked" />
          <Radio name="states" value="checked" label="Checked" defaultChecked />
          <Radio name="disabled" value="1" label="Disabled unchecked" disabled />
          <Radio name="disabled" value="2" label="Disabled checked" disabled defaultChecked />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Without Labels</h3>
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Multiple Radio Groups</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Select your experience level:</p>
          <div className="flex flex-col gap-2">
            <Radio name="experience" value="beginner" label="Beginner" defaultChecked />
            <Radio name="experience" value="intermediate" label="Intermediate" />
            <Radio name="experience" value="advanced" label="Advanced" />
          </div>
        </div>
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
Default.storyName = "Radio"
