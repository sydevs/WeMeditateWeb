import type { Story, StoryDefault } from '@ladle/react'
import { ContentTextBox } from './ContentTextBox'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * ContentTextBox organism showcasing a white content box that overlaps a tall
 * feature image (left/right layouts). For text-over-image use ContentOverlay;
 * for the ornate treatment use OrnateTextBox.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Alignments">
      <div className="flex flex-col gap-16">
        <StorySection title="Left Aligned (Default)" variant="subsection">
          <ContentTextBox
            align="left"
            ctaHref="#"
            ctaText="Classes near me"
            description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world - always completely free."
            imageAlt="Group meditation class with instructor"
            imageHeight={800}
            imageSrc="https://picsum.photos/seed/textbox-left/800/800"
            imageWidth={800}
            title="Get Connected"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <ContentTextBox
            align="right"
            ctaHref="#"
            ctaText="Get started"
            description="Whether you're new to meditation or looking to deepen your practice, our expert instructors guide you every step of the way. Join free classes in your area and discover the transformative power of meditation."
            imageAlt="Beginner meditation session"
            imageHeight={800}
            imageSrc="https://picsum.photos/seed/textbox-right/800/800"
            imageWidth={800}
            title="Learn Meditation"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection
      description="An optional subtitle renders directly below the title, kept visually faded but high-contrast."
      title="Subtitle"
    >
      <ContentTextBox
        align="left"
        ctaHref="#"
        ctaText="Classes near me"
        description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world."
        imageAlt="Group meditation class with instructor"
        imageHeight={1200}
        imageSrc="https://picsum.photos/seed/subtitle-example/900/1200"
        imageWidth={900}
        subtitle="Collective meditation"
        title="Get Connected"
      />
    </StorySection>

    <StorySection title="Image Aspect Ratios">
      <div className="flex flex-col gap-16">
        <StorySection title="Square (1:1)" variant="subsection">
          <ContentTextBox
            align="left"
            ctaHref="#"
            ctaText="Classes near me"
            description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world - always completely free."
            imageAlt="Group meditation class with instructor"
            imageHeight={1200}
            imageSrc="https://picsum.photos/seed/square-meditation/1200/1200"
            imageWidth={1200}
            title="Get Connected"
          />
        </StorySection>

        <StorySection title="Portrait (3:4)" variant="subsection">
          <ContentTextBox
            align="left"
            ctaHref="#"
            ctaText="Start learning"
            description="Follow our comprehensive meditation guide designed for beginners and experienced practitioners alike. Discover techniques that help you achieve deeper states of awareness and inner peace."
            imageAlt="Person in meditation posture"
            imageHeight={1600}
            imageSrc="https://picsum.photos/seed/portrait-person/1200/1600"
            imageWidth={1200}
            title="Meditation Guide"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Constrained Width">
      <div className="max-w-7xl mx-auto px-4">
        <ContentTextBox
          align="left"
          ctaHref="#"
          ctaText="Classes near me"
          description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world - always completely free."
          imageAlt="Group meditation class"
          imageHeight={1000}
          imageSrc="https://picsum.photos/seed/constrained-example/1400/1000"
          imageWidth={1400}
          title="Get Connected"
        />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Content Text Box'
