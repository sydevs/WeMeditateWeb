import type { Story, StoryDefault } from "@ladle/react";
import { Select } from "./Select";
import { StorySection,
  StoryExampleSection, StorySubsection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Select component showcasing all options, optgroups, validation states, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Default">
          <Select>
            <option value="">Choose an option...</option>
            <option value="meditation">Meditation</option>
            <option value="music">Music</option>
            <option value="articles">Articles</option>
            <option value="videos">Videos</option>
          </Select>
        </StorySubsection>

        <StorySubsection label="With Optgroups">
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
        </StorySubsection>

        <StorySubsection label="With Default Value">
          <Select defaultValue="music">
            <option value="meditation">Meditation</option>
            <option value="music">Music</option>
            <option value="articles">Articles</option>
          </Select>
        </StorySubsection>
      </div>
    </StorySection>

    <StorySection title="States">
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
    </StorySection>

    <StorySection title="Widths">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default (256px / w-64)</p>
          <Select>
            <option value="">Choose...</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </Select>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Full Width</p>
          <Select fullWidth>
            <option value="">Choose...</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </Select>
        </div>
      </div>
    </StorySection>

    <StoryExampleSection>
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
    </StoryExampleSection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
Default.storyName = "Select"
