import type { Story, StoryDefault } from '@ladle/react'
import { MeditationLibrary } from './MeditationLibrary'
import type { MeditationChoice, ResolvedMeditationLibrary } from '@/lib/content/blocks'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

const mood = (
  id: number,
  title: string,
  color: string,
  slots: MeditationChoice['slots'],
): MeditationChoice => ({
  id,
  kind: 'mood',
  title,
  iconUrl: `https://picsum.photos/seed/mood-${id}/56/56`,
  color,
  slots,
})

const duration = (
  id: number,
  title: string,
  slots: MeditationChoice['slots'],
): MeditationChoice => ({
  id,
  kind: 'duration',
  title,
  iconUrl: `https://picsum.photos/seed/dur-${id}/56/56`,
  color: '#A4D9D1',
  slots,
})

const CHOICES: MeditationChoice[] = [
  mood(1, 'Excited for the day!', '#FFD591', { morning: 69 }),
  mood(8, 'Need to focus', '#F5B9A8', { morning: 85, afternoon: 85 }),
  mood(16, 'Had a great day', '#DF8E79', { evening: 89 }),
  mood(5, 'Low on energy', '#C9D6A3', { afternoon: 102, evening: 102 }),
  duration(25, '5 min', { morning: 69, evening: 89 }),
  duration(26, '10 min', { morning: 85 }),
  duration(27, '20 min', { evening: 102 }),
]

const listing = (id: number, minutes: number, choiceIds: number[]) => ({
  id,
  href: '#',
  durationMinutes: minutes,
  thumbnail: {
    url: `https://picsum.photos/seed/med-${id}/600/400`,
    alt: '',
    width: 600,
    height: 400,
    aspectRatio: '3-2' as const,
  },
  choiceIds,
})

const LIBRARY: ResolvedMeditationLibrary = {
  choices: CHOICES,
  meditations: [
    listing(69, 15, [1, 25]),
    listing(85, 20, [8, 26]),
    listing(89, 13, [16, 25]),
    listing(102, 18, [5, 27]),
  ],
}

/**
 * MeditationLibrary is the meditation counterpart of MusicLibrary: two
 * questions, then every meditation their answers offer.
 *
 * The tile rows narrow to the visitor's own time of day after mount, so the
 * `timeOfDay` prop pins one here — the browser's real hour would otherwise decide
 * which of these sections you can see. The chip row is single-select: picking a
 * chip narrows the grid to that choice, and picking it again clears it.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Morning: each row keeps only the choices offering a morning meditation."
      title="Morning"
    >
      <MeditationLibrary library={LIBRARY} timeOfDay="morning" />
    </StorySection>

    <StorySection
      description="Evening: a different set of tiles, with the same list below. Night folds into evening until an editor fills the night slots."
      title="Evening"
    >
      <MeditationLibrary library={LIBRARY} timeOfDay="evening" />
    </StorySection>

    <StorySection
      description="No JavaScript, and every server render: every (choice, slot) pair is a link, so the page works unmounted and a crawler sees them all."
      title="Without JavaScript"
    >
      <MeditationLibrary library={LIBRARY} timeOfDay={null} />
    </StorySection>

    <StorySection
      description="A failed or empty read says so, where every other content-index type renders nothing."
      title="Unavailable"
    >
      <MeditationLibrary library={{ choices: [], meditations: [] }} />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Meditation Library'
