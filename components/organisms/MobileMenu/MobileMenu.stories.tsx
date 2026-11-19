import type { Story, StoryDefault } from '@ladle/react'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from '../Header'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/** The nav `useSiteNav` builds: featured pages, then the link-less mega-menu item. */
const navItems: NavItem[] = [
  { label: 'Meditate Now', href: '#/meditate', active: true },
  { label: 'Music for Meditation', href: '#/music' },
  { label: 'Inspiration', href: '#/inspiration' },
  {
    label: 'About Meditation',
    dropdown: {
      title: 'About Meditation',
      links: [
        { label: 'History of Meditation', href: '#/about/history' },
        { label: 'Chakras & Channels', href: '#/about/chakras' },
        { label: 'Inner Energy', href: '#/about/energy' },
        { label: 'Founder of Sahaja Yoga', href: '#/about/founder' },
        { label: 'Further Reading', href: '#/about/reading' },
      ],
      featuredArticles: [],
    },
  },
]

/**
 * The site menu on a phone. The trigger lives in the header's compact bar; the
 * panel it opens covers the screen and lists every destination the `lg:` link
 * row reaches, with the mega-menu item's pages inline.
 *
 * Open it to see the panel. Escape closes it and returns focus to the trigger.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Icon-only ghost button. Its accessible name comes from the content system, and is the same whether the panel is open or closed. A nav with no mega-menu item renders a flat list, with no heading."
      title="Basic Examples"
    >
      <MobileMenu navItems={navItems} />
    </StorySection>

    <StorySection
      description="In the header, the trigger is `lg:hidden` and sits in the compact bar between the logo box and the map pin. The two boxes either side stand in for their layout only — nothing here is pinned to the viewport, so this section cannot measure a hit area. Narrow the window below 1024px to see it."
      inContext={true}
      title="Examples"
    >
      <div className="border-t border-b border-line-subtle">
        <div className="flex max-w-5xl items-center justify-between gap-2 px-6">
          <span className="touch-target shrink-0" />
          <MobileMenu className="lg:hidden" navItems={navItems} />
          <span className="touch-target shrink-0" />
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Mobile Menu'
