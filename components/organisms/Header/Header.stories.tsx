import type { Story, StoryDefault } from '@ladle/react'
import { Header } from './Header'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/** Mega-menu payload for the final nav item ("About Meditation"). */
const aboutDropdown = {
  title: 'About Meditation',
  links: [
    { label: 'History of Meditation', href: '#/about/history' },
    { label: 'Chakras & Channels', href: '#/about/chakras' },
    { label: 'Inner Energy', href: '#/about/energy' },
    { label: 'Founder of Sahaja Yoga', href: '#/about/founder' },
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
 * Complete page header with logo, navigation menu, action link, and breadcrumbs.
 * Demonstrates both light and dark themes with sticky navigation behavior.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Scroll down to see the navigation become sticky with a white background and gray text"
      title="Light Theme (Default)"
      variant="scrollable"
    >
      <Header
        actionLinkHref="/classes"
        actionLinkText="Classes near me"
        breadcrumbs={[
          { label: 'Home Page', href: '/' },
          { label: 'About Meditation', href: '/about' },
          { label: 'Improving Your Meditation' },
        ]}
        logoHref="/"
        navItems={[
          { label: 'Meditate Now', href: '/meditate' },
          { label: 'Music for Meditation', href: '/music' },
          { label: 'Inspiration', href: '/inspiration' },
          { label: 'About Meditation', href: '/about', dropdown: aboutDropdown },
        ]}
        theme="light"
      />

      {/* Long content to demonstrate sticky navigation */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-semibold text-gray-700">Improving Your Meditation Practice</h1>

        <p className="text-base text-gray-600 leading-relaxed">
          This is the default variant suitable for light backgrounds. Notice how the sticky
          navigation maintains visibility as you scroll through the page.
        </p>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <h2 className="text-2xl font-medium text-gray-700 mt-8">Section {i + 1}</h2>
            <p className="text-base text-gray-600 leading-relaxed">
              Content for section {i + 1}. Notice how the sticky navigation maintains visibility as
              you scroll through the page.
            </p>
          </div>
        ))}
      </div>
    </StorySection>

    <StorySection
      background="gradient"
      description="Scroll down to see how the navigation transitions from white text on dark background to gray text on white background when it becomes sticky"
      theme="dark"
      title="Dark Theme"
      variant="scrollable"
    >
      <Header
        actionLinkHref="/classes"
        actionLinkText="Classes near me"
        breadcrumbs={[
          { label: 'Home Page', href: '/' },
          { label: 'About Meditation', href: '/about' },
          { label: 'Improving Your Meditation' },
        ]}
        logoHref="/"
        navItems={[
          { label: 'Meditate Now', href: '/meditate' },
          { label: 'Music for Meditation', href: '/music' },
          { label: 'Inspiration', href: '/inspiration' },
          { label: 'About Meditation', href: '/about', dropdown: aboutDropdown },
        ]}
        theme="dark"
      />

      {/* Long content to demonstrate sticky navigation */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-semibold text-white">Dark Theme for Dark Backgrounds</h1>

        <p className="text-base text-white/90 leading-relaxed">
          The header, navigation, and breadcrumbs all use white text to contrast with the dark
          background. Notice how readability is maintained in all states.
        </p>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <h2 className="text-2xl font-medium text-white mt-8">Section {i + 1}</h2>
            <p className="text-base text-white/90 leading-relaxed">
              Content for section {i + 1}. This demonstrates the scrolling behavior with the sticky
              header.
            </p>
          </div>
        ))}
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Header'
