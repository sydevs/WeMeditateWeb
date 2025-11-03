import type { Story, StoryDefault } from "@ladle/react";
import { Header } from "./Header";
import { StoryWrapper, StorySection, StoryExampleSection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * Complete page header with logo, navigation menu, action link, and breadcrumbs.
 * Demonstrates both light and dark variants with sticky navigation behavior.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Dark Variant (Default)">
      <div className="h-[600px] overflow-y-auto border-4 border-gray-200 bg-white">
        <div className="px-6">
          <Header
            variant="dark"
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
              Scroll down to see the navigation become sticky with a white background and gray text.
              This is the default variant suitable for light backgrounds.
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
        </div>
      </div>
    </StorySection>

    <StorySection title="Light Variant">
      <div className="h-[600px] overflow-y-auto border-4 border-gray-200 bg-linear-to-b from-teal-600 to-teal-700">
        <div className="min-h-full px-6">
          <Header
            variant="light"
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
              Light Variant for Dark Backgrounds
            </h1>

            <p className="text-base text-white/90 leading-relaxed">
              Scroll down to see how the navigation transitions from white text on dark background
              to gray text on white background when it becomes sticky. This ensures readability
              in all states.
            </p>

            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <h2 className="text-2xl font-medium text-white mt-8">
                  Section {i + 1}
                </h2>
                <p className="text-base text-white/90 leading-relaxed">
                  Content for section {i + 1}. The header, navigation, and breadcrumbs all use
                  white text to contrast with the dark background.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Header"
