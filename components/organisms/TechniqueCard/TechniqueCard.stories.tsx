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
        buttonText="Learn more"
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
        buttonText="Learn more"
        align="right"
        className="mt-32"
      />
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Technique Card"
