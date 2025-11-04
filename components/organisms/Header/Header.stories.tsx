import type { Story, StoryDefault } from "@ladle/react";
import { Header } from "./Header";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * Complete page header with logo, navigation menu, action link, and breadcrumbs.
 * Demonstrates both light and dark themes with sticky navigation behavior.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      title="Light Theme (Default)"
      variant="scrollable"
      description="Scroll down to see the navigation become sticky with a white background and gray text"
    >
      <Header
        theme="light"
        logoHref="/"
        actionLinkText="Classes near me"
        actionLinkHref="/classes"
        navItems={[
          { label: 'Meditate Now', href: '/meditate' },
          { label: 'Music for Meditation', href: '/music' },
          { label: 'Inspiration', href: '/inspiration' },
          { label: 'About Meditation', href: '/about' }
        ]}
        breadcrumbs={[
          { label: 'Home Page', href: '/' },
          { label: 'About Meditation', href: '/about' },
          { label: 'Improving Your Meditation' }
        ]}
      />

      {/* Long content to demonstrate sticky navigation */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-semibold text-gray-700">
          Improving Your Meditation Practice
        </h1>

        <p className="text-base text-gray-600 leading-relaxed">
          This is the default variant suitable for light backgrounds.
          Notice how the sticky navigation maintains visibility as you scroll through the page.
        </p>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <h2 className="text-2xl font-medium text-gray-700 mt-8">
              Section {i + 1}
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              Content for section {i + 1}. Notice how the sticky navigation maintains visibility
              as you scroll through the page.
            </p>
          </div>
        ))}
      </div>
    </StorySection>

    <StorySection
      title="Dark Theme"
      theme="dark"
      background="gradient"
      variant="scrollable"
      description="Scroll down to see how the navigation transitions from white text on dark background to gray text on white background when it becomes sticky"
    >
      <Header
        theme="dark"
        logoHref="/"
        actionLinkText="Classes near me"
        actionLinkHref="/classes"
        navItems={[
          { label: 'Meditate Now', href: '/meditate' },
          { label: 'Music for Meditation', href: '/music' },
          { label: 'Inspiration', href: '/inspiration' },
          { label: 'About Meditation', href: '/about' }
        ]}
        breadcrumbs={[
          { label: 'Home Page', href: '/' },
          { label: 'About Meditation', href: '/about' },
          { label: 'Improving Your Meditation' }
        ]}
      />

      {/* Long content to demonstrate sticky navigation */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-semibold text-white">
          Dark Theme for Dark Backgrounds
        </h1>

        <p className="text-base text-white/90 leading-relaxed">
          The header, navigation, and breadcrumbs all use white text to contrast with the dark background.
          Notice how readability is maintained in all states.
        </p>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <h2 className="text-2xl font-medium text-white mt-8">
              Section {i + 1}
            </h2>
            <p className="text-base text-white/90 leading-relaxed">
              Content for section {i + 1}. This demonstrates the scrolling behavior
              with the sticky header.
            </p>
          </div>
        ))}
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Header"
