import type { Story, StoryDefault } from '@ladle/react'
import { MapSearch } from './MapSearch'
import { StoryWrapper, StorySection } from '@/components/ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

/**
 * MapSearch is the Splash block's `map-search` layout: a place search that
 * opens the class map around the place a visitor picks. Its `label` is the
 * block's action text.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-8">
        <StorySection title="With the block's action text" variant="subsection">
          <MapSearch label="Find a class near you" />
        </StorySection>

        <StorySection title="Without one: SahajCloud's own wording" variant="subsection">
          <MapSearch />
        </StorySection>
      </div>
    </StorySection>

    <StorySection inContext={true} surface="dark" title="Examples">
      <div className="py-12">
        <MapSearch label="Find a class near you" />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Map Search'
