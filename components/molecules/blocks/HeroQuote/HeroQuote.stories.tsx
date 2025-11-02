import type { Story, StoryDefault } from '@ladle/react'
import { HeroQuote } from './HeroQuote'
import { StoryWrapper, StorySection } from '../../../ladle'

export default {
  title: 'Molecules / Display'
} satisfies StoryDefault

/**
 * HeroQuote component displays a prominent quote block with decorative leaf dividers.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Large Size (Default)">
      <HeroQuote
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
        credit="Shri Mataji, Founder of Sahaja Yoga"
        caption="Public Program in London, 1978"
      />
    </StorySection>

    <StorySection title="Medium Size">
      <HeroQuote
        size="md"
        text="Come out from the shade of the Tree of Illusion, for only light can destroy the depths from whence your anger came. With all you are, find the flame!"
        credit="John Smith"
        caption="Location in London, 1978"
      />
    </StorySection>

    <StorySection title="Full Content Example">
      <HeroQuote
        title="Complete Example"
        text="This is a complete hero quote example with all optional properties filled in. Notice how the title, text, credit, and caption all work together harmoniously."
        credit="Author Name, Source Location, 2024"
        caption="Additional context or caption information can be placed here."
      />
    </StorySection>

    <StorySection title="Short Quote with Credit">
      <HeroQuote
        text="Meditation brings wisdom."
        credit="Buddha"
      />
    </StorySection>

    <StorySection title="Left Aligned">
      <HeroQuote
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
        credit="Shri Mataji, Founder of Sahaja Yoga, Public Program in London, 1978"
        align="left"
      />

      <HeroQuote
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
        credit="Shri Mataji, Founder of Sahaja Yoga"
        caption="Public Program in London, 1978"
        size="md"
        align="left"
      />
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Hero Quote'
