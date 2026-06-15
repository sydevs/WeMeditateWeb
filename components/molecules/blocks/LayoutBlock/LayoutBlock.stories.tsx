import type { Story, StoryDefault } from '@ladle/react'
import { LayoutBlock } from './LayoutBlock'
import { StoryWrapper, StorySection } from '../../../ladle'
import type { LayoutItem } from '../../../../lib/cms-blocks'

export default {
  title: 'Molecules / Sections',
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

/**
 * LayoutBlock renders the `layout` block in one of five styles. `accordion` and
 * `tabs` reuse the Accordion / ColumnCarousel molecules; `grid`/`list`/`textList`
 * render with a card subcomponent and simple lists.
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
        ]}
        style="accordion"
        title="Frequently asked"
      />
    </StorySection>

    <StorySection title="Tabs">
      <LayoutBlock items={cards} style="tabs" title="Three qualities" />
    </StorySection>

    <StorySection title="Grid">
      <LayoutBlock items={cards} style="grid" title="Explore the chakras" />
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
