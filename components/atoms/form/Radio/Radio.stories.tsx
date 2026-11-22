import type { Story, StoryDefault } from '@ladle/react'
import { Radio } from './Radio'
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
} from '@/components/ladle'

export default {
  title: 'Atoms / Form',
} satisfies StoryDefault

/** Radio component showcasing all variants and states. */
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
              <Radio aria-label="Primary unchecked" name="primary-unchecked" value="1" />
            </StoryGridCell>
            <StoryGridCell>
              <Radio
                aria-label="Secondary unchecked"
                color="secondary"
                name="secondary-unchecked"
                value="1"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Checked</StoryGridCell>
            <StoryGridCell>
              <Radio defaultChecked aria-label="Primary checked" name="primary-checked" value="1" />
            </StoryGridCell>
            <StoryGridCell>
              <Radio
                defaultChecked
                aria-label="Secondary checked"
                color="secondary"
                name="secondary-checked"
                value="1"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled Unchecked</StoryGridCell>
            <StoryGridCell>
              <Radio
                disabled
                aria-label="Primary disabled unchecked"
                name="primary-disabled-unchecked"
                value="1"
              />
            </StoryGridCell>
            <StoryGridCell>
              <Radio
                disabled
                aria-label="Secondary disabled unchecked"
                color="secondary"
                name="secondary-disabled-unchecked"
                value="1"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled Checked</StoryGridCell>
            <StoryGridCell>
              <Radio
                defaultChecked
                disabled
                aria-label="Primary disabled checked"
                name="primary-disabled-checked"
                value="1"
              />
            </StoryGridCell>
            <StoryGridCell>
              <Radio
                defaultChecked
                disabled
                aria-label="Secondary disabled checked"
                color="secondary"
                name="secondary-disabled-checked"
                value="1"
              />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Select your experience level:</p>
          <div className="flex flex-col gap-2">
            <Radio defaultChecked label="Beginner" name="experience" value="beginner" />
            <Radio label="Intermediate" name="experience" value="intermediate" />
            <Radio label="Advanced" name="experience" value="advanced" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Meditation duration:</p>
          <div className="flex flex-col gap-2">
            <Radio label="5 minutes" name="duration" value="5" />
            <Radio defaultChecked label="10 minutes" name="duration" value="10" />
            <Radio label="20 minutes" name="duration" value="20" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-gray-900">Preferred time:</p>
          <div className="flex flex-col gap-2">
            <Radio defaultChecked label="Morning" name="time" value="morning" />
            <Radio label="Afternoon" name="time" value="afternoon" />
            <Radio label="Evening" name="time" value="evening" />
          </div>
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
)
Default.storyName = 'Radio'
