import type { Story, StoryDefault } from '@ladle/react'
import { HeaderNavDropdown } from './HeaderNavDropdown'
import { StorySection, StoryWrapper } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

const sampleDropdown = {
  title: 'About Meditation',
  links: [
    { label: 'History of Meditation', href: '#/about/history' },
    { label: 'Chakras & Channels', href: '#/about/chakras' },
    { label: 'Inner Energy', href: '#/about/energy' },
    { label: 'Founder of Sahaja Yoga', href: '#/about/founder' },
    { label: 'About Sahaja Yoga', href: '#/about/sahaja-yoga' },
    { label: 'Further Reading', href: '#/about/reading' },
  ],
  featuredArticles: [
    {
      title: 'History of Meditation',
      image: 'https://picsum.photos/seed/article1/400/400',
      imageAlt: 'Abstract meditation artwork',
      href: '#/articles/history',
    },
    {
      title: 'Rabindranath Tagore: Between the finite and the infinite',
      image: 'https://picsum.photos/seed/article2/400/400',
      imageAlt: 'Portrait of Rabindranath Tagore',
      href: '#/articles/tagore',
    },
  ],
}

/**
 * A header mega-menu wrapper: a nav item that opens a {@link HeaderDropdown}
 * panel on hover or click, positioned with Floating UI and rendered in a portal.
 *
 * Hover or click "About Meditation" to open the panel. Move the cursor onto
 * it, and safePolygon keeps it open, or press Escape or click outside to
 * close. The trigger is keyboard-focusable and opens on Enter or Space.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="A nav row with one dropdown-capable item. Hover or click to open."
      title="Light Theme (Default)"
    >
      {/* Mimic the Header nav row so the panel has room to drop below it. */}
      <nav className="border-t border-b border-gray-200">
        <div className="flex items-stretch justify-center gap-2 max-w-3xl mx-auto px-6">
          <HeaderNavDropdown
            className="basis-1/4"
            dropdown={sampleDropdown}
            label="About Meditation"
          />
        </div>
      </nav>
      {/* Spacer so the open panel is visible within the section. */}
      <div className="h-96" />
    </StorySection>

    <StorySection
      background="gradient"
      description="Trigger uses white text for dark backgrounds; the panel styling is unchanged."
      theme="dark"
      title="Dark Theme"
    >
      <nav className="border-t border-b border-white/40">
        <div className="flex items-stretch justify-center gap-2 max-w-3xl mx-auto px-6">
          <HeaderNavDropdown
            className="basis-1/4"
            dropdown={sampleDropdown}
            label="About Meditation"
            theme="dark"
          />
        </div>
      </nav>
      <div className="h-96" />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Header Nav Dropdown'
