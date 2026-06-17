import type { Story, StoryDefault } from '@ladle/react'
import { ContentTextBox } from './ContentTextBox'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * ContentTextBox organism showcasing white content box that overlaps
 * a tall feature image, creating visual depth.
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

        <StorySection title="Center / Overlay" variant="subsection">
          <ContentTextBox
            align="center"
            ctaHref="#"
            ctaText="Find events"
            description="Connect with thousands of meditators worldwide. Experience guided sessions, workshops, and events designed to deepen your practice and foster meaningful connections."
            imageAlt="Meditation community gathering"
            imageHeight={800}
            imageSrc="https://picsum.photos/seed/textbox-center/1200/800"
            imageWidth={1200}
            title="Join Our Community"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Subtitle">
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
      description="In center/overlay mode, theme controls the text colour over the image. theme='light' (default) renders dark text; theme='dark' renders white text. A glow keeps text legible over the image."
      title="Overlay Text Color"
    >
      <div className="flex flex-col gap-16">
        <StorySection title="Dark Theme (white text)" variant="subsection">
          <ContentTextBox
            align="center"
            ctaHref="#"
            ctaText="Begin now"
            description="A few minutes of meditation each day can transform your relationship with stress and bring lasting peace."
            imageAlt="Calm evening landscape"
            imageHeight={800}
            imageSrc="https://picsum.photos/seed/overlay-dark/1200/800"
            imageWidth={1200}
            subtitle="Find your center"
            theme="dark"
            title="Inner Stillness"
          />
        </StorySection>

        <StorySection title="Light Theme (dark text)" variant="subsection">
          <ContentTextBox
            align="center"
            ctaHref="#"
            ctaText="Begin now"
            description="A few minutes of meditation each day can transform your relationship with stress and bring lasting peace."
            imageAlt="Bright morning landscape"
            imageHeight={800}
            imageSrc="https://picsum.photos/seed/overlay-light/1200/800"
            imageWidth={1200}
            subtitle="Find your center"
            theme="light"
            title="Inner Stillness"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection
      description="A decorative treatment for the left/right side layouts: a warm parchment box with a floral ornament above a centered title. Has no effect in center/overlay mode."
      title="Ancient Wisdom Styling"
    >
      <ContentTextBox
        wisdomStyle
        align="left"
        ctaHref="#"
        ctaText="Explore the teachings"
        description="For thousands of years, seekers have turned inward to discover a deeper truth. This knowledge, passed down through generations, remains as relevant today as ever."
        imageAlt="Ancient meditation manuscript"
        imageHeight={1200}
        imageSrc="https://picsum.photos/seed/wisdom-example/900/1200"
        imageWidth={900}
        subtitle="Timeless teachings"
        title="Ancient Wisdom"
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

        <StorySection title="Landscape (16:9)" variant="subsection">
          <ContentTextBox
            align="left"
            ctaHref="#"
            ctaText="Learn more"
            description="Develop a daily mindfulness practice that transforms your relationship with stress, anxiety, and everyday challenges. Learn practical techniques you can apply anywhere, anytime."
            imageAlt="Peaceful nature scene"
            imageHeight={1080}
            imageSrc="https://picsum.photos/seed/landscape-nature/1920/1080"
            imageWidth={1920}
            title="Mindfulness Practice"
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

        <StorySection title="Wide (21:9)" variant="subsection">
          <ContentTextBox
            align="left"
            ctaHref="#"
            ctaText="View events"
            description="Join our global community of meditators in person and online. Participate in workshops, retreats, and special events led by experienced teachers from around the world."
            imageAlt="Wide panoramic meditation hall"
            imageHeight={900}
            imageSrc="https://picsum.photos/seed/wide-panorama/2100/900"
            imageWidth={2100}
            title="Community Events"
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
