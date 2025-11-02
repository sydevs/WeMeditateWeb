import type { Story, StoryDefault } from "@ladle/react";
import { Textarea } from "./Textarea";
import {
  StorySection,
  StorySubsection,
  StoryWrapper,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Textarea component showcasing all sizes, auto-resize, validation states, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6 max-w-md">
        <StorySubsection label="Default">
          <Textarea placeholder="Enter your message..." />
        </StorySubsection>

        <StorySubsection label="With Auto-resize">
          <Textarea
            placeholder="Start typing to see auto-resize..."
            autoResize
          />
        </StorySubsection>

        <StorySubsection label="Custom Rows">
          <Textarea
            placeholder="Tall textarea with 8 rows"
            rows={8}
          />
        </StorySubsection>
      </div>
    </StorySection>

    <StorySection title="States × Variants">
      <div className="[&_td:not(:first-child)]:min-w-80">
        <StoryGrid>
          <StoryGridHeader>
            <StoryGridHeaderRow>
              <StoryGridHeaderCell />
              <StoryGridHeaderCell>Default</StoryGridHeaderCell>
              <StoryGridHeaderCell>Minimal</StoryGridHeaderCell>
            </StoryGridHeaderRow>
          </StoryGridHeader>
          <StoryGridBody>
            <StoryGridRow>
              <StoryGridCell isLabel>Default</StoryGridCell>
              <StoryGridCell>
                <Textarea placeholder="Normal textarea" />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea placeholder="Normal textarea" variant="minimal" />
              </StoryGridCell>
            </StoryGridRow>

            <StoryGridRow>
              <StoryGridCell isLabel>Success</StoryGridCell>
              <StoryGridCell>
                <Textarea state="success" defaultValue="Great feedback, thank you!" />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea state="success" defaultValue="Great feedback, thank you!" variant="minimal" />
              </StoryGridCell>
            </StoryGridRow>

            <StoryGridRow>
              <StoryGridCell isLabel>Error</StoryGridCell>
              <StoryGridCell>
                <Textarea state="error" defaultValue="Too short" />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea state="error" defaultValue="Too short" variant="minimal" />
              </StoryGridCell>
            </StoryGridRow>

            <StoryGridRow>
              <StoryGridCell isLabel>Disabled</StoryGridCell>
              <StoryGridCell>
                <Textarea placeholder="Disabled textarea" disabled />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea placeholder="Disabled textarea" disabled variant="minimal" />
              </StoryGridCell>
            </StoryGridRow>
          </StoryGridBody>
        </StoryGrid>
      </div>
    </StorySection>
  </StoryWrapper>
);
Default.storyName = "Textarea"
