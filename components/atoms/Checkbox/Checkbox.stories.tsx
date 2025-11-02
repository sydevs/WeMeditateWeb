import type { Story, StoryDefault } from "@ladle/react";
import { Checkbox } from "./Checkbox";
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
 * Checkbox component showcasing all variants and states.
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
              <Checkbox aria-label="Primary unchecked" />
            </StoryGridCell>
            <StoryGridCell>
              <Checkbox color="secondary" aria-label="Secondary unchecked" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Checked</StoryGridCell>
            <StoryGridCell>
              <Checkbox defaultChecked aria-label="Primary checked" />
            </StoryGridCell>
            <StoryGridCell>
              <Checkbox color="secondary" defaultChecked aria-label="Secondary checked" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled Unchecked</StoryGridCell>
            <StoryGridCell>
              <Checkbox disabled aria-label="Primary disabled unchecked" />
            </StoryGridCell>
            <StoryGridCell>
              <Checkbox color="secondary" disabled aria-label="Secondary disabled unchecked" />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Disabled Checked</StoryGridCell>
            <StoryGridCell>
              <Checkbox disabled defaultChecked aria-label="Primary disabled checked" />
            </StoryGridCell>
            <StoryGridCell>
              <Checkbox color="secondary" disabled defaultChecked aria-label="Secondary disabled checked" />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StoryExampleSection>
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
    </StoryExampleSection>

    <div />
  </StoryWrapper>
);
Default.storyName = "Checkbox"
