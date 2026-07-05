import type { Story, StoryDefault } from '@ladle/react'
import { RelatedContent } from './RelatedContent'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

const card = (
  id: number,
  title: string,
  seed: string,
  durationMinutes?: number,
): ResolvedCardItem => ({
  id,
  title,
  href: '#',
  thumbnailSrc: `https://picsum.photos/seed/${seed}/800/450`,
  aspectRatio: 'video',
  playButton: true,
  durationMinutes,
})

const meditations: ResolvedCardItem[] = [
  card(1, 'Meditation for Vishuddhi', 'rc-med-1', 19),
  card(2, 'Meditation for Nabhi', 'rc-med-2', 18),
  card(3, 'Meditation for Agnya', 'rc-med-3', 20),
  card(4, 'Meditation for Mooladhara', 'rc-med-4', 18),
]

const lectures: ResolvedCardItem[] = [
  card(1, 'Truth Has to Be Experienced', 'rc-lec-1', 16),
  card(2, 'The Kundalini Cleanses and Nourishes', 'rc-lec-2', 8),
  card(3, "Who Is This 'I'?", 'rc-lec-3', 10),
]

/**
 * RelatedContent organism — a titled grid of related cards rendered below a
 * meditation or lecture player. The meditation route shows related lectures and
 * the lecture route shows related meditations (SahajCloud's cross-type mirror).
 * An empty list renders nothing at all.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Shown below the lecture player, sourced from GET /api/lectures/:id/related-meditations."
      title="Related meditations"
    >
      <RelatedContent items={meditations} title="Related meditations" />
    </StorySection>

    <StorySection
      description="Shown below the meditation player, sourced from GET /api/meditations/:id/related-lectures."
      title="Related lectures"
    >
      <RelatedContent items={lectures} title="Related lectures" />
    </StorySection>

    <StorySection
      description="No matches (or a degraded/empty fetch, or a non-English locale) renders nothing — no bare heading."
      title="Empty"
    >
      <RelatedContent items={[]} title="Related meditations" />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Related Content'
