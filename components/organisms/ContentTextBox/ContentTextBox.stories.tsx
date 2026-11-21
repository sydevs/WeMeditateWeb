import type { Story, StoryDefault } from '@ladle/react'
import { ContentTextBox } from './ContentTextBox'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * ContentTextBox is an organism that shows a white content box, overlapping
 * a tall feature image, in a left or right layout. For text-over-image,
 * use ContentOverlay. For the ornate treatment, use OrnateTextBox.
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

    <StorySection
      description="Each line break in the description starts a new paragraph, as in every other text box style."
      title="Paragraphs"
    >
      <ContentTextBox
        align="right"
        ctaHref="#"
        ctaText="Classes near me"
        description={
          'The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world.\n\nEvery class is completely free, and you are welcome to come along whether you have meditated before or not.'
        }
        imageAlt="Group meditation class with instructor"
        imageHeight={1200}
        imageSrc="https://picsum.photos/seed/paragraphs-example/900/1200"
        imageWidth={900}
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

    <StorySection
      description="Drawn from lg up, behind the box and never over its text. On a page, RichText decides which text boxes carry one (lib/textbox-decorations.ts): the first side box opens with the circle, then an image on the left takes the triangle and an image on the right the wash, and no two neighbours repeat one."
      title="Decorations"
    >
      <div className="flex flex-col gap-16">
        <StorySection title="Circle" variant="subsection">
          <ContentTextBox
            align="left"
            ctaHref="#"
            ctaText="Meditate Now"
            decoration="circle"
            description="Whether you're looking to de-stress, boost your self-esteem, or simply seeking a moment to pause, follow our easy yet effective guided meditations."
            imageAlt="Person meditating with eyes closed"
            imageHeight={1200}
            imageSrc="https://picsum.photos/seed/textbox-circle/900/1200"
            imageWidth={900}
            title="Choose your meditation"
          />
        </StorySection>

        <StorySection title="Triangle" variant="subsection">
          <ContentTextBox
            align="left"
            decoration="triangle"
            description="Shri Mataji not only founded and spread the method of Sahaja Yoga far across the world but also created many non-profit organizations in various fields of public life."
            imageAlt="Shri Mataji among a crowd"
            imageHeight={1200}
            imageSrc="https://picsum.photos/seed/textbox-triangle/900/1200"
            imageWidth={900}
            title="A life dedicated to humanity"
          />
        </StorySection>

        <StorySection title="Wash" variant="subsection">
          <ContentTextBox
            align="right"
            decoration="gradient"
            description="Since birth Shri Mataji was surrounded by exceptional people. Her parents were scholars and political activists who played an important role in the liberation movement of India."
            imageAlt="Shri Mataji with her family"
            imageHeight={1200}
            imageSrc="https://picsum.photos/seed/textbox-wash/900/1200"
            imageWidth={900}
            title="Life among great people"
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
