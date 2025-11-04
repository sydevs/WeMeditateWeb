import type { Story, StoryDefault } from "@ladle/react";
import { ContentCard } from "./ContentCard";
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';

export default {
  title: "Molecules / Display"
} satisfies StoryDefault;

// Sample data for stories using picsum.photos
const sampleMeditationData = {
  title: "Feel Love",
  href: "#",
  thumbnailSrc: "https://picsum.photos/seed/meditation1/800/800",
  description: "Unconditional love sounds hard, but it's actually innate to all human beings. Free your mind and feel the love we have within.",
};

const sampleArticleData = {
  title: "What is Meditation?",
  href: "#",
  thumbnailSrc: "https://picsum.photos/seed/article1/800/600",
  description: "Meditation is a state of thoughtless awareness. It is when the incessant flow of thoughts that we experience daily ceases.",
};

const sampleShortData = {
  title: "Guided Meditation",
  href: "#",
  thumbnailSrc: "https://picsum.photos/seed/meditation2/800/800",
};

/**
 * ContentCard molecule showcasing all configurations for content preview display.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        <div>
          <StorySection title="Default Variant - With Description" variant="subsection">
            <ContentCard
              title={sampleMeditationData.title}
              href={sampleMeditationData.href}
              thumbnailSrc={sampleMeditationData.thumbnailSrc}
              description={sampleMeditationData.description}
              variant="default"
            />
          </StorySection>
        </div>

        <div>
          <StorySection title="Default Variant - Without Description" variant="subsection">
            <ContentCard
              title={sampleShortData.title}
              href={sampleShortData.href}
              thumbnailSrc={sampleShortData.thumbnailSrc}
              variant="default"
            />
          </StorySection>
        </div>

        <div>
          <StorySection title="Hero Variant" variant="subsection">
            <ContentCard
              title="Featured Meditation"
              href="#"
              thumbnailSrc="https://picsum.photos/seed/hero/800/800"
              description="Experience this special featured meditation."
              variant="hero"
              playButton={true}
              durationMinutes={15}
              badge="Mindfulness"
              badgeUrl="#"
            />
          </StorySection>
        </div>

        <div>
          <StorySection title="With Category Badge Only" variant="subsection">
            <ContentCard
              title="What is Meditation?"
              href="#"
              thumbnailSrc="https://picsum.photos/seed/article/800/800"
              description="Learn about the ancient practice of meditation."
              variant="default"
              badge="Philosophy"
              badgeUrl="#"
            />
          </StorySection>
        </div>
      </div>
    </StorySection>

    <StorySection title="Variants × Play Button × Aspect Ratios">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell colSpan={2}>Default Variant</StoryGridHeaderCell>
            <StoryGridHeaderCell>Hero Variant</StoryGridHeaderCell>
          </StoryGridHeaderRow>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell size="secondary" />
            <StoryGridHeaderCell size="secondary">No Play</StoryGridHeaderCell>
            <StoryGridHeaderCell size="secondary">With Play</StoryGridHeaderCell>
            <StoryGridHeaderCell size="secondary">With Play</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Square</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid1/800/800"
                aspectRatio="square"
                variant="default"
                playButton={false}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid2/800/800"
                aspectRatio="square"
                variant="default"
                playButton={true}
                durationMinutes={10}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid4/800/800"
                aspectRatio="square"
                variant="hero"
                playButton={true}
                durationMinutes={20}
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Video (16:9)</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid5/800/450"
                aspectRatio="video"
                variant="default"
                playButton={false}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid6/800/450"
                aspectRatio="video"
                variant="default"
                playButton={true}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid8/800/450"
                aspectRatio="video"
                variant="hero"
                playButton={true}
                durationMinutes={5}
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>4:3</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid9/800/600"
                aspectRatio="4/3"
                variant="default"
                playButton={false}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid10/800/600"
                aspectRatio="4/3"
                variant="default"
                playButton={true}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid12/800/600"
                aspectRatio="4/3"
                variant="hero"
                playButton={true}
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>3:2</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid13/800/533"
                aspectRatio="3/2"
                variant="default"
                playButton={false}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid14/800/533"
                aspectRatio="3/2"
                variant="default"
                playButton={true}
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                title="Meditation"
                href="#"
                thumbnailSrc="https://picsum.photos/seed/grid16/800/533"
                aspectRatio="3/2"
                variant="hero"
                playButton={true}
              />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Meditation Grid (Default Variant)" inContext={true}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <ContentCard
          title="Feel Love"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/med1/800/450"
          description="Unconditional love sounds hard, but it's actually innate to all human beings. Free your mind and feel the love we have within."
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="Feel Humble"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/med2/800/450"
          description="Feel like your mind is often occupied with criticisms, either of yourself or others? Silence those thoughts and experience the deep sense of peace that comes with humility."
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="Feel Focused"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/med3/800/450"
          description="Bring your attention back to the center with a few simple exercises to completely clear your mind."
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="Experience Joy"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/med4/800/450"
          description="Try out these simple exercises to see how quickly and spontaneously you can tap into the ocean of true joy emanating from within."
          aspectRatio="video"
          playButton={true}
        />
      </div>
    </StorySection>

    <StorySection title="Mixed Content Grid" inContext={true}>
      <p className="text-sm text-gray-600 mb-4">
        Responsive grid with mixed meditations (default variant with play button) and articles (variety of aspect ratios).
        Resize the browser window to see adaptive layout (1 column on mobile, 2 on tablet, 3 on desktop, 4 on large screens).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Meditation cards */}
        <ContentCard
          title="Morning Meditation"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content1/800/450"
          description="Start your day with clarity and peace through this guided morning meditation."
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="What is Sahaja Yoga?"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content2/800/600"
          description="Discover the ancient practice of Sahaja Yoga and its transformative power."
          aspectRatio="4/3"
        />
        <ContentCard
          title="Evening Calm"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content3/800/450"
          description="Wind down after a long day with this soothing evening meditation practice."
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="Benefits of Daily Practice"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content4/800/533"
          description="Learn how consistent meditation transforms your mind, body, and spirit."
          aspectRatio="3/2"
        />
        <ContentCard
          title="Quick Reset"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content5/800/450"
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="Getting Started Guide"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content6/800/800"
          description="Everything you need to know to begin your meditation journey today."
          aspectRatio="square"
        />
        <ContentCard
          title="Deep Relaxation"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content7/800/450"
          description="Experience profound relaxation and release tension from your entire body."
          aspectRatio="video"
          playButton={true}
        />
        <ContentCard
          title="Science of Meditation"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content8/800/450"
          aspectRatio="video"
        />
      </div>
    </StorySection>
  </StoryWrapper>
);

Default.storyName = "ContentCard"
