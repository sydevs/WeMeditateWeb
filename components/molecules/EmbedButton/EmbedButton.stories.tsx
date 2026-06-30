import type { Story, StoryDefault } from '@ladle/react'
// Import the implementation directly (not the ClientOnly barrel) so the popover
// renders synchronously in Ladle without a Suspense round-trip.
import { EmbedButton } from './EmbedButton'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// Ladle is served from its own host, so pass an explicit origin to keep the
// generated snippet representative of production rather than localhost:61000.
const ORIGIN = 'https://wemeditate.com'

/**
 * EmbedButton renders an "Embed" popover with a read-only, copy-ready iframe
 * snippet pointing at a content item's embed route. Open the popover to see the
 * snippet and the Copy action (with transient "Copied!" feedback).
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Click “Embed” to reveal the snippet and Copy button."
      title="Basic Example"
    >
      <EmbedButton embedPath="/meditations/123/embed" origin={ORIGIN} title="Morning Meditation" />
    </StorySection>

    <StorySection
      description="Non-English locales prefix the embed path (e.g. /es/meditations/123/embed)."
      title="Locales"
    >
      <div className="flex flex-wrap gap-8">
        <StorySection title="English (no prefix)" variant="subsection">
          <EmbedButton embedPath="/meditations/123/embed" locale="en" origin={ORIGIN} />
        </StorySection>
        <StorySection title="Spanish (/es)" variant="subsection">
          <EmbedButton embedPath="/meditations/123/embed" locale="es" origin={ORIGIN} />
        </StorySection>
        <StorySection title="German (/de)" variant="subsection">
          <EmbedButton
            embedPath="/lectures/456/embed"
            locale="de"
            origin={ORIGIN}
            title="Lecture on Joy"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection
      description="Same component for meditations (/meditations/:id/embed) and lectures (/lectures/:id/embed)."
      title="Content Types"
    >
      <div className="flex flex-wrap gap-8">
        <StorySection title="Meditation" variant="subsection">
          <EmbedButton
            embedPath="/meditations/123/embed"
            origin={ORIGIN}
            title="Morning Meditation"
          />
        </StorySection>
        <StorySection title="Lecture" variant="subsection">
          <EmbedButton embedPath="/lectures/456/embed" origin={ORIGIN} title="Lecture on Joy" />
        </StorySection>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex items-center justify-end gap-3 rounded-lg bg-gray-100 p-4">
        <span className="text-sm text-gray-500">Player chrome</span>
        <EmbedButton embedPath="/lectures/456/embed" origin={ORIGIN} title="Lecture on Joy" />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Embed Button'
