import type { Story, StoryDefault } from "@ladle/react";
import { ContentCarousel } from "./ContentCarousel";
import { StoryWrapper, StorySection } from '../../../ladle';

export default {
  title: "Molecules / Sections"
} satisfies StoryDefault;

// Sample meditation data - with play button, duration, title, and optional category badges (no description)
const meditationItems = [
  {
    title: "Inner Peace",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/med1/800/450",
    playButton: true,
    durationMinutes: 15,
    aspectRatio: "video" as const,
    badge: "Relaxation",
    badgeUrl: "#",
  },
  {
    title: "Morning Energy",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/med2/800/450",
    playButton: true,
    durationMinutes: 10,
    aspectRatio: "video" as const,
  },
  {
    title: "Stress Relief",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/med3/800/450",
    playButton: true,
    durationMinutes: 20,
    aspectRatio: "video" as const,
    badge: "Wellness",
    badgeUrl: "#",
  },
  {
    title: "Deep Relaxation",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/med4/800/450",
    playButton: true,
    durationMinutes: 25,
    aspectRatio: "video" as const,
  },
  {
    title: "Focus & Concentration",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/med5/800/450",
    playButton: true,
    durationMinutes: 12,
    aspectRatio: "video" as const,
    badge: "Focus",
    badgeUrl: "#",
  },
  {
    title: "Sleep Meditation",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/med6/800/450",
    playButton: true,
    durationMinutes: 30,
    aspectRatio: "video" as const,
    badge: "Sleep",
    badgeUrl: "#",
  },
];

// Sample article data - with title, description, varied aspect ratios, and category badges (no play button or duration)
const articleItems = [
  {
    title: "What is Meditation?",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/article1/800/800",
    description: "Discover the ancient practice that brings peace and clarity to millions around the world.",
    aspectRatio: "square" as const,
    badge: "Philosophy",
    badgeUrl: "#",
  },
  {
    title: "Benefits of Daily Practice",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/article2/800/600",
    description: "Learn how a consistent meditation routine can transform your mental and physical well-being.",
    aspectRatio: "4/3" as const,
    badge: "Wellness",
    badgeUrl: "#",
  },
  {
    title: "Meditation for Beginners",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/article3/800/533",
    description: "Start your meditation journey with these simple techniques and practical tips.",
    aspectRatio: "3/2" as const,
    badge: "Guides",
    badgeUrl: "#",
  },
  {
    title: "Finding Your Inner Peace",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/article4/800/450",
    description: "Explore the path to tranquility and discover your true self through mindful awareness.",
    aspectRatio: "video" as const,
    badge: "Mindfulness",
    badgeUrl: "#",
  },
  {
    title: "The Science Behind Meditation",
    href: "#",
    thumbnailSrc: "https://picsum.photos/seed/article5/800/800",
    description: "Understand the neuroscience and research supporting meditation's transformative effects.",
    aspectRatio: "square" as const,
    badge: "Science",
    badgeUrl: "#",
  },
];

// Mixed content - combination of meditations and articles with varied aspect ratios
const mixedItems = [
  meditationItems[0],
  articleItems[0],
  meditationItems[1],
  articleItems[1],
  meditationItems[2],
  articleItems[2],
  meditationItems[3],
  articleItems[3],
];

export const ContentCarouselStory: Story = () => (
  <StoryWrapper>
    <StorySection title="Meditations" inContext={true}>
      <p className="text-sm text-gray-600 mb-4">
        Meditation carousel with play buttons, duration badges, and titles (no descriptions).
      </p>
      <ContentCarousel
        title="Featured Meditations"
        items={meditationItems}
      />
    </StorySection>

    <StorySection title="Articles" inContext={true}>
      <p className="text-sm text-gray-600 mb-4">
        Article carousel with titles, descriptions, and varied aspect ratios (no play buttons or duration).
      </p>
      <ContentCarousel
        title="Latest Articles"
        items={articleItems}
      />
    </StorySection>

    <StorySection title="Mixed Content" inContext={true}>
      <p className="text-sm text-gray-600 mb-4">
        Combination of meditations and articles with varied aspect ratios and features.
      </p>
      <ContentCarousel
        title="Explore Content"
        items={mixedItems}
      />
    </StorySection>
  </StoryWrapper>
);

ContentCarouselStory.storyName = "Content Carousel"
