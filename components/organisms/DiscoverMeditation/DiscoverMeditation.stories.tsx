import type { Story, StoryDefault } from '@ladle/react'
import { DiscoverMeditation } from './DiscoverMeditation'
import { StorySection, StoryWrapper } from '@/components/ladle'
import type { NavPage } from '@/types/sahajcloud'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * `classPages` as the live config holds it, with a SEO description on two of
 * the three: the third shows what an action looks like without one.
 */
const CLASS_PAGES: NavPage[] = [
  {
    id: 11,
    slug: 'classes-near-me',
    title: 'Classes Near Me',
    meta: { description: 'Find a free in-person class near you, led by volunteers' },
  },
  {
    id: 14,
    slug: 'live-meditations',
    title: 'Live Meditations',
    meta: { description: 'Join a free guided meditation online, live' },
  },
  { id: 10, slug: 'meditate-now', title: 'Meditate Now' },
]

/**
 * DiscoverMeditation closes the home page, every featured nav page and every
 * knowledge page: a full-height call to action with one action per page an
 * editor picked in `wm-web-config.classPages`, in their order. Each action is
 * the page's title, under a leaf and over its `meta.description` (nothing
 * where it has none).
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <DiscoverMeditation className="full-bleed" pages={CLASS_PAGES} />
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Discover Meditation'
