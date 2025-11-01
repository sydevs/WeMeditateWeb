import type { Story, StoryDefault } from "@ladle/react";
import { Radio } from "./Radio";
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
  StoryExampleSection
} from '../../ladle';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Radio component showcasing all variants and states.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Primary</StoryGridHeaderCell>
            <StoryGridHeaderCell>Secondary</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Unchecked</StoryGridCell>
            <StoryGridCell>
              <Radio name="primary-unchecked" value="1" aria-label="Primary unchecked" />
            </StoryGridCell>
            <StoryGridCell>
              <Radio name="secondary-unchecked" value="1" color="secondary" aria-label="Secondary unchecked" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Checked</StoryGridCell>
            <StoryGridCell>
              <Radio name="primary-checked" value="1" defaultChecked aria-label="Primary checked" />
            </StoryGridCell>
            <StoryGridCell>
              <Radio name="secondary-checked" value="1" color="secondary" defaultChecked aria-label="Secondary checked" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled Unchecked</StoryGridCell>
            <StoryGridCell>
              <Radio name="primary-disabled-unchecked" value="1" disabled aria-label="Primary disabled unchecked" />
            </StoryGridCell>
            <StoryGridCell>
              <Radio name="secondary-disabled-unchecked" value="1" color="secondary" disabled aria-label="Secondary disabled unchecked" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled Checked</StoryGridCell>
            <StoryGridCell>
              <Radio name="primary-disabled-checked" value="1" disabled defaultChecked aria-label="Primary disabled checked" />
            </StoryGridCell>
            <StoryGridCell>
              <Radio name="secondary-disabled-checked" value="1" color="secondary" disabled defaultChecked aria-label="Secondary disabled checked" />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StoryExampleSection>
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
    </StoryExampleSection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
Default.storyName = "Radio"
