import type { Story, StoryDefault } from '@ladle/react'
import { ContentGrid } from './ContentGrid'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// One column of each story grid, in the Ladle story frame. A `breakpointCols`
// change moves these with it — which is the reason the length belongs to the
// caller that sets both.
const THREE_COLUMN = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'
const FOUR_COLUMN =
  '(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw'
const TWO_COLUMN = '(max-width: 639px) 100vw, 50vw'

/** ContentGrid component showcasing content cards in responsive masonry layouts. */
export const Default: Story = () => {
  // Mixed content with various aspect ratios
  const mixedContent = [
    {
      id: 1,
      title: 'Morning Meditation',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/meditation1/400/400',
      thumbnailAlt: 'Morning meditation',
      description: 'Start your day with clarity and peace through this guided morning practice.',
      playButton: true,
      durationMinutes: 10,
      aspectRatio: 'square' as const,
    },
    {
      id: 2,
      title: 'Inner Peace',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/featured1/682/384',
      thumbnailAlt: 'Inner peace meditation',
      playButton: true,
      aspectRatio: 'video' as const,
    },
    {
      id: 3,
      title: 'What is Meditation?',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/article1/640/360',
      thumbnailAlt: 'What is meditation article',
      description: 'Discover the fundamentals of meditation and its transformative power.',
      aspectRatio: 'video' as const,
    },
    {
      id: 4,
      title: 'Chakra Balancing',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/meditation2/400/400',
      thumbnailAlt: 'Chakra meditation',
      playButton: true,
      durationMinutes: 25,
      aspectRatio: 'square' as const,
      badge: 'Advanced',
    },
    {
      id: 5,
      title: 'Evening Reflection',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/meditation3/400/300',
      thumbnailAlt: 'Evening meditation',
      description: 'Wind down with this calming evening practice for better sleep.',
      playButton: true,
      durationMinutes: 15,
      aspectRatio: '4-3' as const,
    },
    {
      id: 6,
      title: 'Mindfulness Guide',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/article2/640/360',
      thumbnailAlt: 'Mindfulness guide',
      description: 'Learn practical techniques for bringing mindfulness into daily life.',
      aspectRatio: 'video' as const,
    },
    {
      id: 7,
      title: 'Deep Relaxation',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/meditation4/400/400',
      thumbnailAlt: 'Relaxation meditation',
      playButton: true,
      durationMinutes: 30,
      aspectRatio: 'square' as const,
      badge: 'Beginner',
    },
    {
      id: 8,
      title: 'Walking Meditation',
      href: '#',
      thumbnailSrc: 'https://picsum.photos/seed/meditation5/400/267',
      thumbnailAlt: 'Walking meditation',
      description: 'Combine gentle movement with meditation techniques.',
      playButton: true,
      durationMinutes: 12,
      aspectRatio: '3-2' as const,
    },
  ]

  return (
    <StoryWrapper>
      <StorySection
        description="3 columns on desktop, 2 on tablet, 1 on mobile with mixed content types and aspect ratios"
        title="Default Grid"
      >
        <ContentGrid items={mixedContent} sizes={THREE_COLUMN} />
      </StorySection>

      <StorySection
        description="Larger cards with bold titles and increased spacing"
        title="Hero Variant"
      >
        <ContentGrid cardVariant="hero" items={mixedContent} sizes={THREE_COLUMN} />
      </StorySection>

      <StorySection description="More columns for wider viewports" title="4 Column Layout">
        <ContentGrid
          breakpointCols={{
            default: 4, // Desktop: 4 columns
            1280: 3, // Large tablets: 3 columns
            768: 2, // Tablets: 2 columns
            640: 1, // Mobile: 1 column
          }}
          items={mixedContent}
          sizes={FOUR_COLUMN}
        />
      </StorySection>

      <StorySection description="Narrower layout for sidebar contexts" title="2 Column Layout">
        <ContentGrid
          breakpointCols={{
            default: 2, // Desktop: 2 columns
            768: 2, // Tablets: 2 columns
            640: 1, // Mobile: 1 column
          }}
          items={mixedContent.slice(0, 6)}
          sizes={TWO_COLUMN}
        />
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Content Grid'
