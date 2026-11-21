import type { Story, StoryDefault } from '@ladle/react'
import { TextBoxOrnament } from './TextBoxOrnament'
import { StoryWrapper, StorySection } from '../../../ladle'

export default {
  title: 'Atoms / Graphics',
} satisfies StoryDefault

/**
 * The ornaments the text-box organisms hang off their images. Each one is
 * absolute and hidden below `lg`, so every example here stands in a grey box
 * playing the part of the positioned ancestor.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Each ornament hangs on the side it is given, and reaches at most 7rem below its ancestor's box."
      title="Variants"
    >
      <div className="flex flex-col gap-32">
        <StorySection title="Triangle" variant="subsection">
          <div className="flex gap-24">
            <div className="relative isolate h-56 w-80 bg-gray-100">
              <TextBoxOrnament decoration="triangle" side="left" />
            </div>
            <div className="relative isolate h-56 w-80 bg-gray-100">
              <TextBoxOrnament decoration="triangle" side="right" />
            </div>
          </div>
        </StorySection>

        <StorySection title="Wash" variant="subsection">
          <div className="flex gap-24">
            <div className="relative isolate h-56 w-80 bg-gray-100">
              <TextBoxOrnament decoration="gradient" side="left" />
            </div>
            <div className="relative isolate h-56 w-80 bg-gray-100">
              <TextBoxOrnament decoration="gradient" side="right" />
            </div>
          </div>
        </StorySection>

        <StorySection title="Leaf circle" variant="subsection">
          <div className="flex gap-32">
            <div className="relative isolate h-56 w-80 bg-gray-100">
              <TextBoxOrnament decoration="circle" side="left" />
            </div>
            <div className="relative isolate h-56 w-80 bg-gray-100">
              <TextBoxOrnament decoration="circle" side="right" />
            </div>
          </div>
        </StorySection>
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Text Box Ornament'
