import type { Story, StoryDefault } from '@ladle/react'
import { Alert } from './Alert'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules / Feedback',
} satisfies StoryDefault

/**
 * Alert shows a contextual message with a semantic icon and color, with an
 * optional title and dismiss button.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <div className="flex max-w-xl flex-col gap-4">
        <Alert variant="info">Your changes have been saved as a draft.</Alert>
        <Alert variant="success">Your meditation was published successfully.</Alert>
        <Alert variant="warning">This page references an unpublished article.</Alert>
        <Alert variant="error">We couldn&apos;t load this content. Please try again.</Alert>
      </div>
    </StorySection>

    <StorySection title="With title">
      <div className="max-w-xl">
        <Alert title="Unknown block" variant="warning">
          No converter for block type &quot;showcase&quot; — it will be implemented in a later
          ticket.
        </Alert>
      </div>
    </StorySection>

    <StorySection title="Dismissible">
      <div className="max-w-xl">
        <Alert variant="info" onDismiss={() => {}}>
          This notice can be dismissed by the user.
        </Alert>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="max-w-xl">
        <Alert title="Submission failed" variant="error">
          Your form could not be submitted. Check your connection and try again.
        </Alert>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Alert'
