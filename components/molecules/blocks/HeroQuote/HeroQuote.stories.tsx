import type { Story, StoryDefault } from '@ladle/react'
import { HeroQuote } from './HeroQuote'
import { StoryWrapper, StorySection } from '../../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

/** HeroQuote component displays a prominent quote block with decorative leaf dividers. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Large Size (Default)">
      <HeroQuote
        caption="Public Program in London, 1978"
        credit="Shri Mataji, Founder of Sahaja Yoga"
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
      />
    </StorySection>

    <StorySection title="Medium Size">
      <HeroQuote
        caption="Location in London, 1978"
        credit="John Smith"
        size="md"
        text="Come out from the shade of the Tree of Illusion, for only light can destroy the depths from whence your anger came. With all you are, find the flame!"
      />
    </StorySection>

    <StorySection title="Full Content Example">
      <HeroQuote
        caption="Additional context or caption information can be placed here."
        credit="Author Name, Source Location, 2024"
        text="This is a complete hero quote example with all optional properties filled in. Notice how the title, text, credit, and caption all work together harmoniously."
        title="Complete Example"
      />
    </StorySection>

    <StorySection title="Short Quote with Credit">
      <HeroQuote credit="Buddha" text="Meditation brings wisdom." />
    </StorySection>

    {/* Each line break in the textarea starts a new paragraph, as in a text box. */}
    <StorySection title="Line Breaks">
      <HeroQuote
        text={[
          'I’m consumed with delight',
          'Feeling that glorious shade penetrate,',
          'Into my body & soul’s inner sight,',
          'Such peace! It fills my very soul,',
          'Woke up this morning feeling one & whole',
        ].join('\r\n')}
      />
    </StorySection>

    <StorySection title="Left Aligned">
      <HeroQuote
        align="left"
        credit="Shri Mataji, Founder of Sahaja Yoga, Public Program in London, 1978"
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
      />

      <HeroQuote
        align="left"
        caption="Public Program in London, 1978"
        credit="Shri Mataji, Founder of Sahaja Yoga"
        size="md"
        text="If you are a scientist, then you must keep your mind opened out. Then when you listen to my hypothesis, then you can experiment with it. Anything that can be experimented with is a scientific thing. You can see for yourself that whatever I'm saying is true or not."
      />
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Hero Quote'
