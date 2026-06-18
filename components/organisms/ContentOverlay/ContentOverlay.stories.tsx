import type { Story, StoryDefault } from '@ladle/react'
import { ContentOverlay } from './ContentOverlay'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * ContentOverlay component showcasing all themes, alignments, and contrast variants.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Dark Theme">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned" variant="subsection">
          <ContentOverlay
            align="left"
            ctaHref="#"
            ctaText="Get Inspired"
            imageAlt="Meditation practice"
            imageSrc="https://picsum.photos/seed/evening-sky/1600/900"
            text={[
              'The benefits of meditation go far beyond what you experience during the sessions.',
              'It has the power to improve every aspect of your life, from your personal growth to your work and family life, and can even spark immense creativity...',
            ]}
            theme="dark"
            title="Beyond the Practice"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <ContentOverlay
            align="right"
            ctaHref="#"
            ctaText="Start Your Journey"
            imageAlt="Inner peace"
            imageSrc="https://picsum.photos/id/122/1600/900"
            text={[
              'Discover the transformative power of daily meditation practice.',
              'Join thousands of practitioners worldwide who have found clarity, peace, and purpose through meditation.',
            ]}
            theme="dark"
            title="Find Your Inner Peace"
          />
        </StorySection>

        <StorySection title="Center Aligned" variant="subsection">
          <ContentOverlay
            align="center"
            ctaHref="#"
            ctaText="Learn More"
            imageAlt="Life transformation"
            imageSrc="https://picsum.photos/id/83/1600/900"
            text={[
              'Experience the profound benefits of meditation in every aspect of your life.',
              'From enhanced creativity to better relationships, meditation unlocks your full potential.',
            ]}
            theme="dark"
            title="Transform Your Life"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection
      description="An optional subtitle renders directly below the title — faded but high-contrast, with the same theme colour and glow."
      title="Subtitle"
    >
      <div className="flex flex-col gap-8">
        <StorySection title="Dark Theme" variant="subsection">
          <ContentOverlay
            align="left"
            ctaHref="#"
            ctaText="Get Inspired"
            imageAlt="Meditation at dusk"
            imageSrc="https://picsum.photos/seed/subtitle-overlay-dark/1600/900"
            subtitle="Collective meditation"
            text="The experience of meditation is even stronger when it is shared with others."
            theme="dark"
            title="Get Connected"
          />
        </StorySection>

        <StorySection title="Light Theme" variant="subsection">
          <ContentOverlay
            align="right"
            ctaHref="#"
            ctaText="Begin Today"
            imageAlt="Bright morning meditation"
            imageSrc="https://picsum.photos/seed/subtitle-overlay-light/1600/900"
            subtitle="Find your center"
            text="A few minutes of meditation each day can transform your relationship with stress."
            theme="light"
            title="Inner Stillness"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Light Theme">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned" variant="subsection">
          <ContentOverlay
            align="left"
            ctaHref="#"
            ctaText="Explore Techniques"
            imageAlt="Unlock potential"
            imageSrc="https://picsum.photos/id/293/1600/900"
            text={[
              'Meditation is the key to unlocking creativity, focus, and inner strength.',
              "Through regular practice, you'll discover abilities you never knew you had.",
            ]}
            theme="light"
            title="Unlock Your Potential"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <ContentOverlay
            align="right"
            ctaHref="#"
            ctaText="Begin Today"
            imageAlt="Mental clarity"
            imageSrc="https://picsum.photos/id/14/1600/900"
            text={[
              "Clear your mind and find answers to life's biggest questions.",
              'Meditation provides the mental space needed for breakthrough insights and deep understanding.',
            ]}
            theme="light"
            title="Discover True Clarity"
          />
        </StorySection>

        <StorySection title="Center Aligned" variant="subsection">
          <ContentOverlay
            align="center"
            ctaHref="#"
            ctaText="Join Now"
            imageAlt="Meditation community"
            imageSrc="https://picsum.photos/id/131/1600/900"
            text={[
              'Connect with meditators around the world on a shared journey of self-discovery.',
              'Share experiences, learn from others, and grow together in a supportive environment.',
            ]}
            theme="light"
            title="Join Our Community"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="High Contrast Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Dark Theme with High Contrast" variant="subsection">
          <ContentOverlay
            align="left"
            ctaHref="#"
            ctaText="Learn More"
            imageAlt="High contrast dark theme"
            imageSrc="https://picsum.photos/seed/dark-pattern/1600/900"
            text={[
              'The high contrast variant adds halo shadows around text and darkens the background image for improved readability.',
              'Perfect for images with complex patterns or when maximum text clarity is needed.',
            ]}
            theme="dark"
            title="Enhanced Readability"
            variant="highContrast"
          />
        </StorySection>

        <StorySection title="Light Theme with High Contrast" variant="subsection">
          <ContentOverlay
            align="right"
            ctaHref="#"
            ctaText="Get Started"
            imageAlt="High contrast light theme"
            imageSrc="https://picsum.photos/id/13/1600/900"
            text={[
              'In light theme, the high contrast mode applies white halo shadows and screen blend mode.',
              'This ensures your content remains legible even over busy or bright background images.',
            ]}
            theme="light"
            title="Crystal Clear Content"
            variant="highContrast"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Box Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Dark Theme with Box" variant="subsection">
          <ContentOverlay
            align="center"
            ctaHref="#"
            ctaText="Explore Features"
            imageAlt="Box variant dark theme"
            imageSrc="https://picsum.photos/1600/900?random=1"
            text={[
              'The box variant wraps content in a bordered container with backdrop blur for a card-like appearance.',
              'Ideal for creating distinct, elevated content areas over complex background images.',
            ]}
            theme="dark"
            title="Contained & Focused"
            variant="box"
          />
        </StorySection>

        <StorySection title="Light Theme with Box" variant="subsection">
          <ContentOverlay
            align="right"
            ctaHref="#"
            ctaText="View Details"
            imageAlt="Box variant light theme"
            imageSrc="https://picsum.photos/1600/900?random=2"
            text={[
              'In light theme, the box variant creates a subtle frosted glass effect that complements bright images.',
              'Perfect for premium content showcases and feature announcements.',
            ]}
            theme="light"
            title="Elegant Presentation"
            variant="box"
          />
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Content Overlay'
