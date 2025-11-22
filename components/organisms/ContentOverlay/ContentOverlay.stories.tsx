import type { Story, StoryDefault } from "@ladle/react";
import { ContentOverlay } from "./ContentOverlay";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * ContentOverlay component showcasing all themes, alignments, and contrast variants.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Dark Theme">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned" variant="subsection">
          <ContentOverlay
            title="Beyond the Practice"
            text={[
              "The benefits of meditation go far beyond what you experience during the sessions.",
              "It has the power to improve every aspect of your life, from your personal growth to your work and family life, and can even spark immense creativity..."
            ]}
            imageSrc="https://picsum.photos/seed/evening-sky/1600/900"
            imageAlt="Meditation practice"
            ctaText="Get Inspired"
            ctaHref="#"
            theme="dark"
            align="left"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <ContentOverlay
            title="Find Your Inner Peace"
            text={[
              "Discover the transformative power of daily meditation practice.",
              "Join thousands of practitioners worldwide who have found clarity, peace, and purpose through meditation."
            ]}
            imageSrc="https://picsum.photos/id/122/1600/900"
            imageAlt="Inner peace"
            ctaText="Start Your Journey"
            ctaHref="#"
            theme="dark"
            align="right"
          />
        </StorySection>

        <StorySection title="Center Aligned" variant="subsection">
          <ContentOverlay
            title="Transform Your Life"
            text={[
              "Experience the profound benefits of meditation in every aspect of your life.",
              "From enhanced creativity to better relationships, meditation unlocks your full potential."
            ]}
            imageSrc="https://picsum.photos/id/83/1600/900"
            imageAlt="Life transformation"
            ctaText="Learn More"
            ctaHref="#"
            theme="dark"
            align="center"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Light Theme">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned" variant="subsection">
          <ContentOverlay
            title="Unlock Your Potential"
            text={[
              "Meditation is the key to unlocking creativity, focus, and inner strength.",
              "Through regular practice, you'll discover abilities you never knew you had."
            ]}
            imageSrc="https://picsum.photos/id/293/1600/900"
            imageAlt="Unlock potential"
            ctaText="Explore Techniques"
            ctaHref="#"
            theme="light"
            align="left"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <ContentOverlay
            title="Discover True Clarity"
            text={[
              "Clear your mind and find answers to life's biggest questions.",
              "Meditation provides the mental space needed for breakthrough insights and deep understanding."
            ]}
            imageSrc="https://picsum.photos/id/14/1600/900"
            imageAlt="Mental clarity"
            ctaText="Begin Today"
            ctaHref="#"
            theme="light"
            align="right"
          />
        </StorySection>

        <StorySection title="Center Aligned" variant="subsection">
          <ContentOverlay
            title="Join Our Community"
            text={[
              "Connect with meditators around the world on a shared journey of self-discovery.",
              "Share experiences, learn from others, and grow together in a supportive environment."
            ]}
            imageSrc="https://picsum.photos/id/131/1600/900"
            imageAlt="Meditation community"
            ctaText="Join Now"
            ctaHref="#"
            theme="light"
            align="center"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="High Contrast Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Dark Theme with High Contrast" variant="subsection">
          <ContentOverlay
            title="Enhanced Readability"
            text={[
              "The high contrast variant adds halo shadows around text and darkens the background image for improved readability.",
              "Perfect for images with complex patterns or when maximum text clarity is needed."
            ]}
            imageSrc="https://picsum.photos/seed/dark-pattern/1600/900"
            imageAlt="High contrast dark theme"
            ctaText="Learn More"
            ctaHref="#"
            theme="dark"
            align="left"
            variant="highContrast"
          />
        </StorySection>

        <StorySection title="Light Theme with High Contrast" variant="subsection">
          <ContentOverlay
            title="Crystal Clear Content"
            text={[
              "In light theme, the high contrast mode applies white halo shadows and screen blend mode.",
              "This ensures your content remains legible even over busy or bright background images."
            ]}
            imageSrc="https://picsum.photos/id/13/1600/900"
            imageAlt="High contrast light theme"
            ctaText="Get Started"
            ctaHref="#"
            theme="light"
            align="right"
            variant="highContrast"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Box Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Dark Theme with Box" variant="subsection">
          <ContentOverlay
            title="Contained & Focused"
            text={[
              "The box variant wraps content in a bordered container with backdrop blur for a card-like appearance.",
              "Ideal for creating distinct, elevated content areas over complex background images."
            ]}
            imageSrc="https://picsum.photos/1600/900?random=1"
            imageAlt="Box variant dark theme"
            ctaText="Explore Features"
            ctaHref="#"
            theme="dark"
            align="center"
            variant="box"
          />
        </StorySection>

        <StorySection title="Light Theme with Box" variant="subsection">
          <ContentOverlay
            title="Elegant Presentation"
            text={[
              "In light theme, the box variant creates a subtle frosted glass effect that complements bright images.",
              "Perfect for premium content showcases and feature announcements."
            ]}
            imageSrc="https://picsum.photos/1600/900?random=2"
            imageAlt="Box variant light theme"
            ctaText="View Details"
            ctaHref="#"
            theme="light"
            align="right"
            variant="box"
          />
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Content Overlay"
