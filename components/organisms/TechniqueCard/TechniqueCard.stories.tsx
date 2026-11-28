import type { Story, StoryDefault } from '@ladle/react'
import { TechniqueCard } from './TechniqueCard'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * TechniqueCard component showcasing meditation technique information with
 * alternating left/right image layouts.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Left Aligned">
      <TechniqueCard
        align="left"
        className="mt-32"
        description="Simple and inexpensive, soaking your feet in saltwater is the daily habit you didn't know you needed. Imagine standing with your feet in the ocean, letting it soothe your stresses away and calm your mind. Luckily, foot-soaking can also be done in the comfort of your own home!"
        href="/techniques/foot-soak"
        imageAlt="Foot soaking relaxation technique"
        imageSrc="https://picsum.photos/seed/technique1/400/400"
        number="01"
        title="Foot Soak"
      />
    </StorySection>

    <StorySection title="Right Aligned">
      <TechniqueCard
        align="right"
        className="mt-32"
        description="Feeling overworked and exhausted? The liver is like an overheated running engine, constantly working to provide fuel for the brain. Cool your thoughts down by meditating with an ice pack on your liver."
        href="/techniques/ice-on-liver"
        imageAlt="Ice on liver meditation technique"
        imageSrc="https://picsum.photos/seed/technique2/400/400"
        number="02"
        title="Ice on Liver"
      />
    </StorySection>

    {/*
      What a lone page relationship in rich text draws: no number, the image at
      the ratio nearest its own, and the description's line break kept.
    */}
    <StorySection title="Without a Number">
      <TechniqueCard
        className="mt-32"
        description={'Good for:\nBetter sleep, overall daily cleansing, cooling the right channel'}
        href="/footsoaking"
        imageAlt="Footsoaking - watercolor overlay"
        imageAspectRatio="4-3"
        imageSrc="https://picsum.photos/seed/technique3/840/660"
        title="Footsoaking"
      />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Technique Card'
