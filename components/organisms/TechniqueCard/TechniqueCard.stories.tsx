import type { Story, StoryDefault } from '@ladle/react'
import { TechniqueCard } from './TechniqueCard'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * TechniqueCard organism - Displays meditation techniques based on wemeditate.com/techniques design.
 * Features left/right alignment with large gradient backgrounds and numbered badges.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-20">
    {/* Left-aligned card */}
    <TechniqueCard
      number="02"
      title="Foot Soak"
      description="Simple and inexpensive, soaking your feet in saltwater is the daily habit you didn't know you needed. Imagine standing with your feet in the ocean, letting it soothe your stresses away and calm your mind. Luckily, foot-soaking can also be done in the comfort of your own home!"
      buttonText="Learn more"
      imageSrc="https://picsum.photos/id/64/600/600"
      imageAlt="Person soaking feet in yellow basin"
      align="left"
      onButtonClick={() => console.log('Foot Soak clicked')}
    />

    {/* Right-aligned card */}
    <TechniqueCard
      number="03"
      title="Ice on Liver"
      description="Feeling overworked and exhausted? The liver is like an overheated running engine, constantly working to provide fuel for the brain. Cool your thoughts down by meditating with an ice pack on your liver."
      buttonText="Learn more"
      imageSrc="https://picsum.photos/id/65/600/600"
      imageAlt="Person sitting with hands in meditation position"
      align="right"
      onButtonClick={() => console.log('Ice on Liver clicked')}
    />

    {/* Another left-aligned card with different number */}
    <TechniqueCard
      number="04"
      title="Candle Meditation"
      description="Train your attention and quiet your mind by focusing on the gentle flicker of a candle flame. This ancient technique helps develop concentration while creating a peaceful, meditative atmosphere."
      buttonText="Discover technique"
      imageSrc="https://picsum.photos/id/68/600/600"
      imageAlt="Candle flame for meditation"
      align="left"
    />
  </div>
)

Default.storyName = 'TechniqueCard'
