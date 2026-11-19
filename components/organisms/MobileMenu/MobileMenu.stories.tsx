import type { Story, StoryDefault } from '@ladle/react'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from '../Header'
import type { SocialLink } from '../Footer'
import type { LanguageOption } from '../../molecules/LanguageDropdown'
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

const languages: LanguageOption[] = [
  { code: 'en', label: 'English', href: '/' },
  { code: 'es', label: 'Español', href: '/' },
  { code: 'de', label: 'Deutsch', href: '/' },
]

const socialLinks: SocialLink[] = [
  { platform: 'facebook', href: 'https://facebook.com/wemeditate' },
  { platform: 'instagram', href: 'https://instagram.com/wemeditate' },
  { platform: 'youtube', href: 'https://youtube.com/wemeditate' },
]

/**
 * The site menu on a phone. The trigger lives in the header's compact bar; the
 * panel it opens covers the screen, starting on a copy of that bar so × lands
 * where ☰ was. It lists every destination the `lg:` link row reaches, centred,
 * with the mega-menu item as a disclosure over its pages, then the action link,
 * the social profiles and the languages.
 *
 * Open it to see the panel. Escape closes it and returns focus to the trigger.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Icon-only ghost button. Its accessible name comes from the content system, and is the same whether the panel is open or closed."
      title="Basic Examples"
    >
      <MobileMenu
        actionLinkHref="#/classes"
        actionLinkText="Classes Near Me"
        currentLanguage="en"
        languages={languages}
        navItems={navItems}
        socialLinks={socialLinks}
      />
    </StorySection>

    <StorySection
      description="A single-language site has no language list, and a site with no class page has no action link."
      title="States"
    >
      <MobileMenu navItems={navItems} />
    </StorySection>

    <StorySection
      description="In the header, the trigger is `lg:hidden` and holds the compact bar's right edge, after the logo and the map pin. The boxes before it stand in for their layout only — nothing here is pinned to the viewport, so this section cannot measure a hit area. Narrow the window below 1024px to see it."
      inContext={true}
      title="Examples"
    >
      <div className="border-b border-line-subtle">
        <div className="flex min-h-14 items-center gap-2 px-6">
          <span className="touch-target mr-auto shrink-0" />
          <div className="flex shrink-0 items-center -mr-2.5">
            <span className="touch-target shrink-0" />
            <MobileMenu className="lg:hidden" navItems={navItems} />
          </div>
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Mobile Menu'
