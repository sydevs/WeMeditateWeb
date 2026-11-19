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
        languages={languages}
        navItems={navItems}
        socialLinks={socialLinks}
      />
    </StorySection>

    <StorySection
      description="A single-language site has no language list, and a site with no class page has no action link. The Header story shows the trigger in its bar: narrow the window below 1024px."
      title="States"
    >
      <MobileMenu navItems={navItems} />
    </StorySection>
  </StoryWrapper>
)

Default.storyName = 'Mobile Menu'
