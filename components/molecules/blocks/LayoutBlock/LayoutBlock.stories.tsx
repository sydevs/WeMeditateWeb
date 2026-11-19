import type { Story, StoryDefault } from '@ladle/react'
import { LayoutBlock } from './LayoutBlock'
import { StoryWrapper, StorySection } from '../../../ladle'
import type { LayoutItem } from '../../../../lib/content-blocks'

export default {
  title: 'Molecules',
} satisfies StoryDefault

const imageRef = (seed: string, alt: string): LayoutItem['image'] =>
  ({
    id: seed,
    url: `https://picsum.photos/seed/${seed}/1200/675`,
    alt,
    width: 1200,
    height: 675,
  }) as unknown as LayoutItem['image']

const steps: LayoutItem[] = [
  { id: 's1', title: 'Step 1', text: 'Sit comfortably with your hands open on your lap.' },
  {
    id: 's2',
    title: 'Step 2',
    text: 'Soften your gaze and let your attention settle on the breath.',
  },
  { id: 's3', title: 'Step 3', text: 'When the mind wanders, gently return to the breath.' },
]

const cards: LayoutItem[] = [
  {
    id: 'c1',
    title: 'Innocence',
    text: 'The quality of the Mooladhara chakra.',
    image: imageRef('lay1', 'Innocence'),
    titleUrl: '#',
  },
  {
    id: 'c2',
    title: 'Creativity',
    text: 'The quality of the Swadisthan chakra.',
    image: imageRef('lay2', 'Creativity'),
    titleUrl: '#',
  },
  {
    id: 'c3',
    title: 'Generosity',
    text: 'The quality of the Nabhi chakra.',
    image: imageRef('lay3', 'Generosity'),
    titleUrl: '#',
  },
]

// Tabs as SahajCloud sends them: each `titleUrl` is the tab's own anchor.
const aspects: LayoutItem[] = [
  { id: 'a1', title: 'Center aspect', titleUrl: '#center-aspect', text: 'Innocence and wisdom.' },
  { id: 'a2', title: 'Left Aspect', titleUrl: '#left-aspect', text: 'A pure desire to grow.' },
  { id: 'a3', title: 'Right Aspect', titleUrl: '#right-aspect', text: 'Dynamism and discipline.' },
]

const moments: LayoutItem[] = [
  { id: 'm1', title: 'Italy, 1986', text: 'Proclaimed Personality of the Year.' },
  {
    id: 'm2',
    title: 'Moscow, 1989',
    text: 'Full government support,\nincluding research funding.',
  },
  { id: 'm3', title: 'St. Petersburg, 1993', text: 'Honorary member of the Petrovsky Academy.' },
  { id: 'm4', title: 'Brasilia, 1994', text: 'Presented with the key to the city.' },
  { id: 'm5', title: 'New York, 1994', text: 'A day declared in her honour.' },
]

/**
 * LayoutBlock renders the `layout` block in one of five styles. `accordion`,
 * `tabs` and `grid` reuse the Accordion, ColumnCarousel and MasonryGrid
 * molecules. `list` and `textList` render with a card subcomponent and a
 * simple list. Tabs are columns on a wide screen and a carousel on a narrow
 * one, opening on `defaultTab`, as wemeditate.com drew them.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Accordion">
      <LayoutBlock
        items={[
          {
            id: 'q1',
            title: 'How much does it cost?',
            text: 'Classes are always 100% free of charge.',
          },
          {
            id: 'q2',
            title: 'What do I bring?',
            text: 'No equipment is required — just an open mind.',
          },
          { id: 'q3', title: 'Do I need experience?', text: 'None at all. Everyone is welcome.' },
          {
            id: 'q4',
            title: 'Where are the classes?',
            text: 'Online, and in cities around the world.',
            titleUrl: 'classes-near-me',
            image: imageRef('lay4', 'A class in a park'),
          },
        ]}
        style="accordion"
        title="Frequently asked"
      />
    </StorySection>

    <StorySection description="Opens on its default tab below lg: the first here" title="Tabs">
      <LayoutBlock defaultTab="#center-aspect" items={aspects} style="tabs" />
    </StorySection>

    <StorySection title="Grid">
      <LayoutBlock items={cards} style="grid" title="Explore the chakras" />
    </StorySection>

    <StorySection description="Five items: three, then Show More" title="Grid with Show More">
      <LayoutBlock items={moments} style="grid" />
    </StorySection>

    <StorySection title="List">
      <LayoutBlock items={cards} style="list" />
    </StorySection>

    <StorySection title="Text list">
      <LayoutBlock items={steps} style="textList" title="How to do it" />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Layout Block'
