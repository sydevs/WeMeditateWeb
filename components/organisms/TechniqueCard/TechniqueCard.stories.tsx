import type { Story, StoryDefault } from "@ladle/react";
import { TechniqueCard } from "./TechniqueCard";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * TechniqueCard component showcasing meditation technique information with
 * alternating left/right image layouts.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Left Aligned">
      <TechniqueCard
        number="01"
        title="Foot Soak"
        description="Simple and inexpensive, soaking your feet in saltwater is the daily habit you didn't know you needed. Imagine standing with your feet in the ocean, letting it soothe your stresses away and calm your mind. Luckily, foot-soaking can also be done in the comfort of your own home!"
        imageSrc="https://picsum.photos/seed/technique1/400/400"
        imageAlt="Foot soaking relaxation technique"
        href="/techniques/foot-soak"
        align="left"
        className="mt-32"
      />
    </StorySection>

    <StorySection title="Right Aligned">
      <TechniqueCard
        number="02"
        title="Ice on Liver"
        description="Feeling overworked and exhausted? The liver is like an overheated running engine, constantly working to provide fuel for the brain. Cool your thoughts down by meditating with an ice pack on your liver."
        imageSrc="https://picsum.photos/seed/technique2/400/400"
        imageAlt="Ice on liver meditation technique"
        href="/techniques/ice-on-liver"
        align="right"
        className="mt-32"
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
);

Default.storyName = "Technique Card"
