import type { Story, StoryDefault } from '@ladle/react'
import { MoodPicker } from './MoodPicker'
import type { ResolvedMood } from '@/lib/content/blocks'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * The icons are SahajCloud SVG uploads drawn as CSS masks, which Ladle has no
 * API key to read. These are inline data URLs of the same shape, so the mask,
 * the colour fill and the hover state are all real here.
 */
const icon = (path: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${path}</svg>`,
  )}`

const SUN = icon(
  '<circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M20 4l-2 2M6 18l-2 2" stroke="currentColor" stroke-width="2" fill="none"/>',
)
const LEAF = icon('<path d="M4 20C4 10 12 4 20 4c0 10-8 16-16 16z"/>')
const MOON = icon('<path d="M20 14a8 8 0 11-10-10 7 7 0 0010 10z"/>')

const mood = (
  id: string,
  title: string,
  color: string | null,
  iconUrl: string,
  slots: ResolvedMood['slots'],
): ResolvedMood => ({ id, title, color, iconUrl, slots })

const MORNING = [
  mood('1', 'Ready for the day', '#e0a23c', SUN, { morning: '#' }),
  mood('2', 'Low on energy, need a boost', '#72b3a9', LEAF, { morning: '#' }),
  mood('3', 'Grateful', '#c98bb9', MOON, { morning: '#' }),
  mood('4', 'Clearing my head', '#427b73', LEAF, { morning: '#' }),
]

const AFTERNOON = [
  mood('5', 'Stressed and tense', '#c0675d', LEAF, { afternoon: '#' }),
  mood('6', 'Distracted', '#4f7fa8', SUN, { afternoon: '#' }),
  mood('7', 'Restless', '#d98b5f', MOON, { afternoon: '#' }),
  mood('8', 'Overwhelmed', '#6b8fd6', LEAF, { afternoon: '#' }),
]

const EVENING = [
  mood('9', 'Winding down', '#3d4f7c', MOON, { evening: '#' }),
  mood('10', 'Ready for sleep', '#5da5a0', MOON, { evening: '#' }),
  mood('11', 'Unsettled', '#7bbf8e', LEAF, { evening: '#' }),
  mood('12', 'Quietly content', '#d6a86b', SUN, { evening: '#' }),
  mood('13', 'Carrying the day', '#c0675d', LEAF, { evening: '#' }),
  mood('14', 'Letting go', '#83bcb4', SUN, { evening: '#' }),
]

/** One mood per slot, so the no-slot section has something to narrow. */
const ONE_EACH = [MORNING[0], AFTERNOON[0], EVENING[0]]

/**
 * MoodPicker is the app's mood screen on the web: one round tile per featured
 * mood that has a meditation for the visitor's time of day, each linking
 * straight to it. Hover or tab to a tile to see the circle fill with the mood's
 * own colour and the icon turn white.
 *
 * The slot is resolved on the server from the visitor's Cloudflare zone and
 * confirmed by the browser after mount. These sections pass the slot directly,
 * which is what each time of day looks like.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="The four featured morning moods, two to a row below sm and three from sm up."
      title="Morning"
    >
      <MoodPicker moods={MORNING} serverSlot="morning" />
    </StorySection>

    <StorySection description="The four featured afternoon moods." title="Afternoon">
      <MoodPicker moods={AFTERNOON} serverSlot="afternoon" />
    </StorySection>

    <StorySection
      description="Six featured moods in the evening, the fullest slot upstream holds."
      title="Evening"
    >
      <MoodPicker moods={EVENING} serverSlot="evening" />
    </StorySection>

    <StorySection
      description="With no zone to read, the server sends every mood at its own filled slot, and the browser narrows them after mount."
      title="No server slot"
    >
      <MoodPicker moods={ONE_EACH} serverSlot={null} />
    </StorySection>

    <StorySection
      description="An editor's colour field is free text upstream, so a value that is not a hex colour is refused during the resolve and the tile falls back to the site teal."
      title="A colour that is not a hex value"
    >
      <MoodPicker
        moods={[mood('15', 'Colour refused', null, LEAF, { morning: '#' })]}
        serverSlot="morning"
      />
    </StorySection>

    <StorySection
      description="No mood has a meditation for this slot, so the block renders nothing at all — like every other content index with an empty list."
      title="Nothing for the slot"
    >
      <MoodPicker moods={MORNING} serverSlot="evening" />
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Mood Picker'
