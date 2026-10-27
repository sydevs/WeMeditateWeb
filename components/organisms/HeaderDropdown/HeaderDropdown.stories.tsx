import type { Story, StoryDefault } from "@ladle/react";
import { HeaderDropdown } from "./HeaderDropdown";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * Header dropdown mega nav with title, navigation links, and featured articles.
 * Features hover overlay effect on article thumbnails with lotus decoration.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Default Dropdown">
      <HeaderDropdown
        title="About Meditation"
        links={[
          { label: 'History of Meditation', href: '#/about/history' },
          { label: 'Chakras & Channels', href: '#/about/chakras' },
          { label: 'Inner Energy', href: '#/about/energy' },
          { label: 'Founder of Sahaja Yoga', href: '#/about/founder' },
          { label: 'About Sahaja Yoga', href: '#/about/sahaja-yoga' },
          { label: 'Improving Your Meditation', href: '#/about/improving' },
          { label: 'Further Reading', href: '#/about/reading' }
        ]}
        featuredArticles={[
          {
            title: 'History of Meditation',
            image: 'https://picsum.photos/seed/article1/400/400',
            imageAlt: 'Abstract meditation artwork',
            href: '#/articles/history'
          },
          {
            title: 'Rabindranath Tagore: Between the finite and the infinite',
            image: 'https://picsum.photos/seed/article2/400/400',
            imageAlt: 'Portrait of Rabindranath Tagore',
            href: '#/articles/tagore'
          }
        ]}
      />
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="space-y-12">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-4">
            Techniques Dropdown
          </p>
          <HeaderDropdown
            title="Techniques"
            links={[
              { label: 'Meditation for Beginners', href: '#/techniques/beginners' },
              { label: 'How to Meditate', href: '#/techniques/how-to' },
              { label: 'Guided Meditation', href: '#/techniques/guided' },
              { label: 'Affirmations', href: '#/techniques/affirmations' },
              { label: 'Chakra Meditation', href: '#/techniques/chakras' }
            ]}
            featuredArticles={[
              {
                title: 'Getting Started with Meditation',
                image: 'https://picsum.photos/seed/technique1/400/400',
                imageAlt: 'Person meditating peacefully',
                href: '#/articles/getting-started'
              },
              {
                title: 'Advanced Techniques for Inner Peace',
                image: 'https://picsum.photos/seed/technique2/400/400',
                imageAlt: 'Meditation in nature',
                href: '#/articles/advanced-techniques'
              }
            ]}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-4">
            Music Dropdown
          </p>
          <HeaderDropdown
            title="Music for Meditation"
            links={[
              { label: 'Meditation Music', href: '#/music/meditation' },
              { label: 'Ragas', href: '#/music/ragas' },
              { label: 'Mantras', href: '#/music/mantras' },
              { label: 'Classical Music', href: '#/music/classical' }
            ]}
            featuredArticles={[
              {
                title: 'The Power of Ragas in Meditation',
                image: 'https://picsum.photos/seed/music1/400/400',
                imageAlt: 'Musical instruments',
                href: '#/articles/ragas'
              },
              {
                title: 'Sacred Mantras for Deep Meditation',
                image: 'https://picsum.photos/seed/music2/400/400',
                imageAlt: 'Person chanting',
                href: '#/articles/mantras'
              }
            ]}
          />
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Header Dropdown"
