import type { Story, StoryDefault } from '@ladle/react'
import { ClassDirectory } from './ClassDirectory'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * The class directory, placed on an ordinary page.
 *
 * ⚠ **The widget does not mount here.** Every atlas read is refused off a
 * domain listed on the client record, and Ladle is not one — so what these
 * stories show is the box the server renders and the loader adopts, not the
 * directory itself. Its interior is the atlas's own.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="The box the widget adopts. Its height is explicit rather than a min-height: the widget's own height resolves against this parent, and an auto one leaves it zero."
      title="Variants"
    >
      <div className="flex flex-col gap-12">
        <StorySection title="With the map" variant="subsection">
          <ClassDirectory />
        </StorySection>

        <StorySection title="As a list, online classes only" variant="subsection">
          <ClassDirectory onlineOnly showMap={false} />
        </StorySection>

        <StorySection title="Opening at a region" variant="subsection">
          <ClassDirectory atlasRoute="/london" showMap={false} />
        </StorySection>
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'ClassDirectory'
