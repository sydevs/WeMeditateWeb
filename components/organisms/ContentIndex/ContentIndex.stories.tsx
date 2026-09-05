import type { Story, StoryDefault } from '@ladle/react'
import { ContentIndex } from './ContentIndex'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

const WISDOM = { id: 'wisdom', label: 'Wisdom' }
const LIFESTYLE = { id: 'lifestyle', label: 'Lifestyle' }
const TECHNIQUE = { id: 'technique', label: 'Technique' }

const card = (
  id: number,
  title: string,
  seed: string,
  tags?: { id: string; label: string }[],
): ResolvedCardItem => ({
  id,
  title,
  href: '#',
  thumbnailSrc: `https://picsum.photos/seed/${seed}/600/400`,
  aspectRatio: '3-2',
  tags,
})

const tagged: ResolvedCardItem[] = [
  card(1, 'What Is Meditation?', 'ci-wisdom-1', [WISDOM]),
  card(2, 'A Balanced Daily Routine', 'ci-life-1', [LIFESTYLE]),
  card(3, 'The Kundalini Awakening', 'ci-wisdom-2', [WISDOM, TECHNIQUE]),
  card(4, 'Mindful Mornings', 'ci-life-2', [LIFESTYLE]),
  card(5, 'The Three Channels', 'ci-tech-1', [TECHNIQUE]),
  card(6, 'Inner Silence', 'ci-wisdom-3', [WISDOM]),
]

const untagged: ResolvedCardItem[] = [
  card(1, 'Introduction', 'ci-plain-1'),
  card(2, 'Getting Started', 'ci-plain-2'),
  card(3, 'Next Steps', 'ci-plain-3'),
]

/**
 * ContentIndex is a server-resolved card grid that the visitor filters
 * client-side with multi-select pills. Toggle the pills to narrow the
 * grid. The "All" pill clears the selection.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Facets are derived from the items' own tags. Multi-select (OR); the 'All' pill resets."
      title="With filter pills"
    >
      <ContentIndex items={tagged} />
    </StorySection>

    <StorySection
      description="When no item carries tags (e.g. today's lecture feed), the pill row is omitted and it degrades to a plain grid."
      title="No facets"
    >
      <ContentIndex items={untagged} />
    </StorySection>

    <StorySection description="An empty list renders nothing (no pills, no grid)." title="Empty">
      <ContentIndex items={[]} />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Content Index'
