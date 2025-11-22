import type { Story, StoryDefault } from "@ladle/react";
import { ContentTextBox } from "./ContentTextBox";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

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
            title="Get Connected"
            description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world - always completely free."
            ctaText="Classes near me"
            ctaHref="#"
            imageSrc="https://picsum.photos/800?random=1"
            imageAlt="Group meditation class with instructor"
            imageWidth={800}
            imageHeight={800}
            align="left"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <ContentTextBox
            title="Learn Meditation"
            description="Whether you're new to meditation or looking to deepen your practice, our expert instructors guide you every step of the way. Join free classes in your area and discover the transformative power of meditation."
            ctaText="Get started"
            ctaHref="#"
            imageSrc="https://picsum.photos/800?random=1"
            imageAlt="Beginner meditation session"
            imageWidth={800}
            imageHeight={800}
            align="right"
          />
        </StorySection>

        <StorySection title="Center Aligned" variant="subsection">
          <ContentTextBox
            title="Join Our Community"
            description="Connect with thousands of meditators worldwide. Experience guided sessions, workshops, and events designed to deepen your practice and foster meaningful connections."
            ctaText="Find events"
            ctaHref="#"
            imageSrc="https://picsum.photos/1200/800?random=1"
            imageAlt="Meditation community gathering"
            imageWidth={1200}
            imageHeight={800}
            align="center"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Image Aspect Ratios">
      <div className="flex flex-col gap-16">
        <StorySection title="Square (1:1)" variant="subsection">
          <ContentTextBox
            title="Get Connected"
            description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world - always completely free."
            ctaText="Classes near me"
            ctaHref="#"
            imageSrc="https://picsum.photos/seed/square-meditation/1200/1200"
            imageAlt="Group meditation class with instructor"
            imageWidth={1200}
            imageHeight={1200}
            align="left"
          />
        </StorySection>

        <StorySection title="Landscape (16:9)" variant="subsection">
          <ContentTextBox
            title="Mindfulness Practice"
            description="Develop a daily mindfulness practice that transforms your relationship with stress, anxiety, and everyday challenges. Learn practical techniques you can apply anywhere, anytime."
            ctaText="Learn more"
            ctaHref="#"
            imageSrc="https://picsum.photos/seed/landscape-nature/1920/1080"
            imageAlt="Peaceful nature scene"
            imageWidth={1920}
            imageHeight={1080}
            align="left"
          />
        </StorySection>

        <StorySection title="Portrait (3:4)" variant="subsection">
          <ContentTextBox
            title="Meditation Guide"
            description="Follow our comprehensive meditation guide designed for beginners and experienced practitioners alike. Discover techniques that help you achieve deeper states of awareness and inner peace."
            ctaText="Start learning"
            ctaHref="#"
            imageSrc="https://picsum.photos/seed/portrait-person/1200/1600"
            imageAlt="Person in meditation posture"
            imageWidth={1200}
            imageHeight={1600}
            align="left"
          />
        </StorySection>

        <StorySection title="Wide (21:9)" variant="subsection">
          <ContentTextBox
            title="Community Events"
            description="Join our global community of meditators in person and online. Participate in workshops, retreats, and special events led by experienced teachers from around the world."
            ctaText="View events"
            ctaHref="#"
            imageSrc="https://picsum.photos/seed/wide-panorama/2100/900"
            imageAlt="Wide panoramic meditation hall"
            imageWidth={2100}
            imageHeight={900}
            align="left"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Constrained Width" inContext={true}>
      <div className="max-w-7xl mx-auto px-4">
        <ContentTextBox
          title="Get Connected"
          description="The experience of meditation is even stronger when it is shared! Discover the beauty of collective meditations, led by experienced practitioners in hundreds of cities around the world - always completely free."
          ctaText="Classes near me"
          ctaHref="#"
          imageSrc="https://picsum.photos/seed/constrained-example/1400/1000"
          imageAlt="Group meditation class"
          imageWidth={1400}
          imageHeight={1000}
          align="left"
        />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Content Text Box"
