import type { Story, StoryDefault } from '@ladle/react'
import { ContentCard } from './ContentCard'
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// Sample data for stories using picsum.photos
const sampleMeditationData = {
  title: 'Feel Love',
  href: '#',
  thumbnailSrc: 'https://picsum.photos/seed/meditation1/800/800',
  description:
    "Unconditional love sounds hard, but it's actually innate to all human beings. Free your mind and feel the love we have within.",
}

const sampleShortData = {
  title: 'Guided Meditation',
  href: '#',
  thumbnailSrc: 'https://picsum.photos/seed/meditation2/800/800',
}

/** ContentCard molecule showcasing all configurations for content preview display. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        <div>
          <StorySection title="Default Variant - With Description" variant="subsection">
            <ContentCard
              description={sampleMeditationData.description}
              href={sampleMeditationData.href}
              thumbnailSrc={sampleMeditationData.thumbnailSrc}
              title={sampleMeditationData.title}
              variant="default"
            />
          </StorySection>
        </div>

        <div>
          <StorySection title="Default Variant - Without Description" variant="subsection">
            <ContentCard
              href={sampleShortData.href}
              thumbnailSrc={sampleShortData.thumbnailSrc}
              title={sampleShortData.title}
              variant="default"
            />
          </StorySection>
        </div>

        <div>
          <StorySection title="Hero Variant" variant="subsection">
            <ContentCard
              badge="Mindfulness"
              badgeUrl="#"
              description="Experience this special featured meditation."
              durationMinutes={15}
              href="#"
              playButton={true}
              thumbnailSrc="https://picsum.photos/seed/hero/800/800"
              title="Featured Meditation"
              variant="hero"
            />
          </StorySection>
        </div>

        <div>
          <StorySection title="With Category Badge Only" variant="subsection">
            <ContentCard
              badge="Philosophy"
              badgeUrl="#"
              description="Learn about the ancient practice of meditation."
              href="#"
              thumbnailSrc="https://picsum.photos/seed/article/800/800"
              title="What is Meditation?"
              variant="default"
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
                aspectRatio="square"
                href="#"
                playButton={false}
                thumbnailSrc="https://picsum.photos/seed/grid1/800/800"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="square"
                durationMinutes={10}
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid2/800/800"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="square"
                durationMinutes={20}
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid4/800/800"
                title="Meditation"
                variant="hero"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Video (16:9)</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="video"
                href="#"
                playButton={false}
                thumbnailSrc="https://picsum.photos/seed/grid5/800/450"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="video"
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid6/800/450"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="video"
                durationMinutes={5}
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid8/800/450"
                title="Meditation"
                variant="hero"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>4:3</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="4-3"
                href="#"
                playButton={false}
                thumbnailSrc="https://picsum.photos/seed/grid9/800/600"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="4-3"
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid10/800/600"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="4-3"
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid12/800/600"
                title="Meditation"
                variant="hero"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>3:2</StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="3-2"
                href="#"
                playButton={false}
                thumbnailSrc="https://picsum.photos/seed/grid13/800/533"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="3-2"
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid14/800/533"
                title="Meditation"
                variant="default"
              />
            </StoryGridCell>
            <StoryGridCell>
              <ContentCard
                aspectRatio="3-2"
                href="#"
                playButton={true}
                thumbnailSrc="https://picsum.photos/seed/grid16/800/533"
                title="Meditation"
                variant="hero"
              />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection inContext={true} title="Meditation Grid (Default Variant)">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <ContentCard
          aspectRatio="video"
          description="Unconditional love sounds hard, but it's actually innate to all human beings. Free your mind and feel the love we have within."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/med1/800/450"
          title="Feel Love"
        />
        <ContentCard
          aspectRatio="video"
          description="Feel like your mind is often occupied with criticisms, either of yourself or others? Silence those thoughts and experience the deep sense of peace that comes with humility."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/med2/800/450"
          title="Feel Humble"
        />
        <ContentCard
          aspectRatio="video"
          description="Bring your attention back to the center with a few simple exercises to completely clear your mind."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/med3/800/450"
          title="Feel Focused"
        />
        <ContentCard
          aspectRatio="video"
          description="Try out these simple exercises to see how quickly and spontaneously you can tap into the ocean of true joy emanating from within."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/med4/800/450"
          title="Experience Joy"
        />
      </div>
    </StorySection>

    <StorySection inContext={true} title="Mixed Content Grid">
      <p className="text-sm text-gray-700 mb-4">
        Responsive grid with mixed meditations (default variant with play button) and articles
        (variety of aspect ratios). Resize the browser window to see adaptive layout (1 column on
        mobile, 2 on tablet, 3 on desktop, 4 on large screens).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Meditation cards */}
        <ContentCard
          aspectRatio="video"
          description="Start your day with clarity and peace through this guided morning meditation."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/content1/800/450"
          title="Morning Meditation"
        />
        <ContentCard
          aspectRatio="4-3"
          description="Discover the ancient practice of Sahaja Yoga and its transformative power."
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content2/800/600"
          title="What is Sahaja Yoga?"
        />
        <ContentCard
          aspectRatio="video"
          description="Wind down after a long day with this soothing evening meditation practice."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/content3/800/450"
          title="Evening Calm"
        />
        <ContentCard
          aspectRatio="3-2"
          description="Learn how consistent meditation transforms your mind, body, and spirit."
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content4/800/533"
          title="Benefits of Daily Practice"
        />
        <ContentCard
          aspectRatio="video"
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/content5/800/450"
          title="Quick Reset"
        />
        <ContentCard
          aspectRatio="square"
          description="Everything you need to know to begin your meditation journey today."
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content6/800/800"
          title="Getting Started Guide"
        />
        <ContentCard
          aspectRatio="video"
          description="Experience profound relaxation and release tension from your entire body."
          href="#"
          playButton={true}
          thumbnailSrc="https://picsum.photos/seed/content7/800/450"
          title="Deep Relaxation"
        />
        <ContentCard
          aspectRatio="video"
          href="#"
          thumbnailSrc="https://picsum.photos/seed/content8/800/450"
          title="Science of Meditation"
        />
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'ContentCard'
