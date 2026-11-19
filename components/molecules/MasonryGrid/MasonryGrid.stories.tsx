import type { Story, StoryDefault } from '@ladle/react'
import { MasonryGrid, MasonryGridItem } from './MasonryGrid'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// Sample data based on Shri Mataji timeline from wemeditate.com
const sampleItems: MasonryGridItem[] = [
  {
    id: 1,
    title: 'Italy, 1986',
    text: 'The Italian government proclaims Shri Mataji as the Personality of the Year.',
  },
  {
    id: 2,
    title: 'Moscow, Russia, 1989',
    text: "Succeeding Shri Mataji's meeting with the Minister for Health of the USSR, Sahaja Yoga receives full government support, including funding of scientific research.",
  },
  {
    id: 3,
    title: 'St. Petersburg, Russia, 1993',
    text: 'Elected as an honorary member of the Petrovsky Academy of Arts and Science. Shri Mataji opens the International Conference on Medicine and Self-knowledge, which subsequently becomes an annual conference.',
  },
  {
    id: 4,
    title: 'Brasilia, Brazil, 1994',
    text: 'Shri Mataji is welcomed at the airport by the Mayor of Brasilia, who presents her with the key to the city and sponsors all of her programs.',
  },
  {
    id: 5,
    title: 'New York, USA, 1994',
    text: "26th September is declared 'Shri Mataji Nirmala Devi Day'. Shri Mataji is offered a police escort for a parade in her honour.",
  },
  {
    id: 6,
    title: 'Bucharest, Romania, 1995',
    text: 'Granted an Honorary Doctorate in Cognitive Science by Prof D Drime, head of the Ecological University Bucharest.',
  },
  {
    id: 7,
    title: 'Beijing, China 1995',
    text: 'The Chinese government invites Shri Mataji to be an official guest speaker at the 4th UN Conference on Women.',
  },
  {
    id: 8,
    title: 'British Columbia, Canada, 1994',
    text: 'On behalf of the people of Canada, the Premier of the Province of British Columbia, Mr Mike Harcourt, extends a letter of welcome to Shri Mataji.',
  },
  {
    id: 9,
    title: 'Pune, India, 1996',
    text: "Shri Mataji addresses the 'World Philosophers Meet '96 - A Parliament of Science, Religion and Philosophy', where she is celebrated for the establishment of Sahaja Yoga.",
  },
  {
    id: 10,
    title: 'USA, 105th Congress, 1997 and 106th Congress, 2000',
    text: 'Honorarium read into the Congressional Record by Congressman Eliot Engle, who commends Shri Mataji for her dedicated and tireless work for humanity.',
  },
  {
    id: 11,
    title: 'Cabella Ligure, Italy, 2006',
    text: "The Italian government awards Shri Mataji with honorary citizenship, succeeded by the presentation of the foundation stone for the 'Shri Mataji Nirmala Devi World Foundation of Sahaja Yoga' in Cabella Ligure.",
  },
]

// Sample data with links for demonstrating linked items
const linkedItems: MasonryGridItem[] = [
  {
    id: 1,
    title: 'Introduction to Meditation',
    text: 'Learn the fundamental techniques and benefits of meditation practice for beginners.',
    href: '/meditations/introduction',
  },
  {
    id: 2,
    title: 'Advanced Meditation Techniques',
    text: 'Explore deeper meditation practices and how to overcome common obstacles in your practice.',
    href: '/meditations/advanced',
  },
  {
    id: 3,
    title: 'Meditation for Stress Relief',
    text: 'Discover specific meditation techniques designed to reduce stress and promote inner calm.',
    href: '/meditations/stress-relief',
  },
  {
    id: 4,
    title: 'Daily Meditation Practice',
    text: 'Build a sustainable daily meditation routine with practical tips and guided exercises.',
    href: '/meditations/daily-practice',
  },
]

// Image items, as the layout block's `grid` style offers them.
const imageItems: MasonryGridItem[] = [
  {
    id: 1,
    title: 'Morning',
    text: 'Start the day clear.',
    href: '/meditations/morning',
    image: {
      src: 'https://picsum.photos/seed/masonry-morning/640/360',
      alt: 'Sunrise over a lake',
    },
  },
  {
    id: 2,
    title: 'Evening',
    text: 'Let the day go.\nSit for ten minutes before bed.',
    image: { src: 'https://picsum.photos/seed/masonry-evening/640/360', alt: 'Dusk over hills' },
  },
  {
    id: 3,
    title: 'Anywhere',
    text: 'A few minutes of silence fit into any part of the day.',
  },
]

/**
 * MasonryGrid renders the layout block's `grid` style: each item drops into
 * the shortest of up to three columns, and items past the first three wait
 * behind "Show More", which moves focus to the first one it reveals.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Three items, then Show More for the other eight, as the Shri Mataji timeline does"
      title="Basic Example"
    >
      <MasonryGrid items={sampleItems} />
    </StorySection>

    <StorySection
      description="An item with an href links its title. All four show, so there is no button"
      title="Linked Items"
    >
      <MasonryGrid initialItemCount={linkedItems.length} items={linkedItems} />
    </StorySection>

    <StorySection
      description="An optional image above the title; line breaks in the text are kept"
      title="With Images"
    >
      <MasonryGrid items={imageItems} />
    </StorySection>

    <StorySection
      description="Showing 6 items initially with Show More button"
      title="Custom Initial Count"
    >
      <MasonryGrid initialItemCount={6} items={sampleItems} />
    </StorySection>

    <StorySection inContext={true} title="In the Article Column">
      <div className="max-w-4xl mx-auto">
        <MasonryGrid headingLevel="h2" items={sampleItems} />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Masonry Grid'
