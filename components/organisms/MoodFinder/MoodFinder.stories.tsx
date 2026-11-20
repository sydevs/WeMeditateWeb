import type { Story, StoryDefault } from '@ladle/react'
import { MoodFinder } from './MoodFinder'
import type { MoodCard } from '../../../lib/content-blocks'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

const mood = (moodId: number, moodTitle: string, minutes: number, color: string): MoodCard => ({
  moodId,
  moodTitle,
  iconUrl: `https://picsum.photos/seed/mood-${moodId}/64/64`,
  color,
  href: '#',
  durationMinutes: minutes,
  thumbnail: null,
})

/** The six the categories mark featured for the evening — the widest slot. */
const evening: MoodCard[] = [
  mood(89, 'Had a great day, feeling good!', 15, '#DF8E79'),
  mood(130, 'Winding down', 14, '#A1C3D7'),
  mood(132, 'Restless, hard to settle', 20, '#FFD591'),
  mood(86, 'Grateful', 16, '#A4D9D1'),
  mood(87, 'Carrying the day home', 15, '#DF8E79'),
  mood(137, 'Ready to sleep', 18, '#A1C3D7'),
]

/** The four for the morning, which is the smallest slot the finder ever shows. */
const morning = evening.slice(0, 4)

/**
 * MoodFinder asks a visitor how they feel and takes them, in one click, to the
 * meditation the categories name for that mood and the visitor's own time of
 * day. The moods are resolved on the server, so there is no filtering here —
 * one tile per mood, one meditation per tile.
 *
 * The colour is an editor-chosen accent behind the icon only. It carries no
 * contrast contract upstream, so no label ever sits on it.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="The six moods the categories feature for the evening, each a click from its meditation."
      title="Evening"
    >
      <MoodFinder moods={evening} />
    </StorySection>

    <StorySection
      description="The morning and afternoon slots carry four moods each — the fewest the finder ever shows."
      title="Morning"
    >
      <MoodFinder moods={morning} />
    </StorySection>

    <StorySection
      description="An empty list is a failed or empty read. Unlike every other content-index type, it says so rather than rendering nothing: a blank space is where this page's whole purpose should be."
      title="Unavailable"
    >
      <MoodFinder moods={[]} />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Mood Finder'
