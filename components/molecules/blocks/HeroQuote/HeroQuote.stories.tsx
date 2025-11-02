import type { Story, StoryDefault } from '@ladle/react'
import { HeroQuote } from './HeroQuote'
import { StoryWrapper, StorySection } from '../../../ladle'

export default {
  title: 'Molecules / Blocks'
} satisfies StoryDefault

/**
 * HeroQuote component displays a prominent quote block with decorative leaf dividers.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Full Content Example">
      <HeroQuote
        title="Complete Example"
        text="This is a complete hero quote example with all optional properties filled in. Notice how the title, text, credit, and caption all work together harmoniously."
        credit="Author Name, Source Location, 2024"
        caption="Additional context or caption information can be placed here."
      />
    </StorySection>

    <StorySection title="Minimal Content Example">
      <HeroQuote
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
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
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Hero Quote'
