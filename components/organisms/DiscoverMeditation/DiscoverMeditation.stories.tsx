import type { Story, StoryDefault } from '@ladle/react'
import { DiscoverMeditation } from './DiscoverMeditation'
import { StorySection, StoryWrapper } from '../../ladle'
import type { NavPage } from '../../../server/sahajcloud-types'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/** `classPages` as the live config holds it: three pages, no meta of their own. */
const CONFIGURED: NavPage[] = [
  { id: 11, slug: 'classes-near-me', title: 'Classes Near Me' },
  { id: 14, slug: 'live-meditations', title: 'Live Meditations' },
  { id: 10, slug: 'meditate-now', title: 'Meditate Now' },
]

const image = (seed: string) =>
  ({ id: 1, url: `https://picsum.photos/seed/${seed}/200/200`, alt: '' }) as NonNullable<
    NavPage['meta']
  >['image']

/** The same pages once an editor fills in each one's SEO description and image. */
const DESCRIBED: NavPage[] = [
  {
    ...CONFIGURED[0],
    meta: {
      description: 'Find a free in-person class near you, led by volunteers',
      image: image('discover-classes'),
    },
  },
  {
    ...CONFIGURED[1],
    meta: {
      description: 'Join a free guided meditation online, live',
      image: image('discover-live'),
    },
  },
  { ...CONFIGURED[2], meta: { description: 'Start a guided meditation right now' } },
]

/**
 * DiscoverMeditation closes the home page: a full-height call to action with
 * one action per page an editor picked in `wm-web-config.classPages`, in their
 * order. Each action is the page's title, under its `meta.image` (a leaf where
 * it has none) and over its `meta.description` (nothing where it has none).
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <StorySection title="Pages with no meta, as configured today" variant="subsection">
        <DiscoverMeditation className="full-bleed" pages={CONFIGURED} />
      </StorySection>
      <StorySection title="Pages with a description, and an image on two" variant="subsection">
        <DiscoverMeditation className="full-bleed" pages={DESCRIBED} />
      </StorySection>
    </StorySection>
    <div />
  </StoryWrapper>
)

Default.storyName = 'Discover Meditation'
