import type { Story, StoryDefault } from "@ladle/react";
import { Select } from "./Select";

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Select component showcasing all options, optgroups, validation states, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Select</h3>
      <Select>
        <option value="">Choose an option...</option>
        <option value="meditation">Meditation</option>
        <option value="music">Music</option>
        <option value="articles">Articles</option>
        <option value="videos">Videos</option>
      </Select>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Optgroups</h3>
      <Select>
        <option value="">Select a technique...</option>
        <optgroup label="Beginner">
          <option value="breathing">Breathing Meditation</option>
          <option value="body-scan">Body Scan</option>
        </optgroup>
        <optgroup label="Advanced">
          <option value="chakra">Chakra Meditation</option>
          <option value="kundalini">Kundalini</option>
        </optgroup>
      </Select>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Default Value</h3>
      <Select defaultValue="music">
        <option value="meditation">Meditation</option>
        <option value="music">Music</option>
        <option value="articles">Articles</option>
      </Select>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default</p>
          <Select>
            <option value="">Choose...</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </Select>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Success</p>
          <Select state="success" defaultValue="1">
            <option value="1">Valid Selection</option>
            <option value="2">Option 2</option>
          </Select>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Error</p>
          <Select state="error">
            <option value="">Please select an option</option>
            <option value="1">Option 1</option>
          </Select>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Disabled</p>
          <Select disabled>
            <option value="">Disabled select</option>
            <option value="1">Option 1</option>
          </Select>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Profile Form</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1 text-gray-900">
            Country
          </label>
          <Select id="country" fullWidth>
            <option value="">Select your country...</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
            <option value="au">Australia</option>
            <option value="de">Germany</option>
            <option value="fr">France</option>
          </Select>
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-1 text-gray-900">
            Preferred Language
          </label>
          <Select id="language" fullWidth defaultValue="en">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
          </Select>
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Select"
