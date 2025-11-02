import type { Story, StoryDefault } from '@ladle/react'
import { LeafDivider } from './LeafDivider'
import { StoryWrapper, StorySection, StoryGrid } from '../../ladle'

export default {
  title: 'Atoms / Layout'
} satisfies StoryDefault

/**
 * LeafDivider component provides a decorative divider with leaf ornaments.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="With Line">
      <div className="max-w-2xl mx-auto">
        <LeafDivider showLine direction="up" />
        <p className="text-gray-dark text-center my-5">Content in between</p>
        <LeafDivider showLine direction="down" />
      </div>
    </StorySection>

    <StorySection title="Without Line">
      <div className="max-w-2xl mx-auto">
        <LeafDivider showLine={false} direction="up" />
        <p className="text-gray-dark text-center my-5">Content in between</p>
        <LeafDivider showLine={false} direction="down" />
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Leaf Divider'
