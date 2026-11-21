import type { Story, StoryDefault } from '@ladle/react'
import { Textarea } from './Textarea'
import {
  StorySection,
  StoryWrapper,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '../../../ladle'

export default {
  title: 'Atoms / Form',
} satisfies StoryDefault

/**
 * Textarea component showcasing all sizes, auto-resize, validation states, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6 max-w-md">
        <StorySection title="Default" variant="subsection">
          <Textarea placeholder="Enter your message..." />
        </StorySection>

        <StorySection title="With Auto-resize" variant="subsection">
          <Textarea autoResize placeholder="Start typing to see auto-resize..." />
        </StorySection>

        <StorySection title="Custom Rows" variant="subsection">
          <Textarea placeholder="Tall textarea with 8 rows" rows={8} />
        </StorySection>
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
                <Textarea defaultValue="Great feedback, thank you!" state="success" />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea
                  defaultValue="Great feedback, thank you!"
                  state="success"
                  variant="minimal"
                />
              </StoryGridCell>
            </StoryGridRow>

            <StoryGridRow>
              <StoryGridCell isLabel>Error</StoryGridCell>
              <StoryGridCell>
                <Textarea defaultValue="Too short" state="error" />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea defaultValue="Too short" state="error" variant="minimal" />
              </StoryGridCell>
            </StoryGridRow>

            <StoryGridRow>
              <StoryGridCell isLabel>Disabled</StoryGridCell>
              <StoryGridCell>
                <Textarea disabled placeholder="Disabled textarea" />
              </StoryGridCell>
              <StoryGridCell>
                <Textarea disabled placeholder="Disabled textarea" variant="minimal" />
              </StoryGridCell>
            </StoryGridRow>
          </StoryGridBody>
        </StoryGrid>
      </div>
    </StorySection>
  </StoryWrapper>
)
Default.storyName = 'Textarea'
