import type { Story, StoryDefault } from '@ladle/react'
import { FooterLinkList } from './FooterLinkList'
import { StorySection, StoryWrapper } from '../../ladle'

export default {
  title: 'Molecules / Display',
} satisfies StoryDefault

const sampleLinks = [
  { text: 'The First Experience', href: '/first-experience' },
  { text: 'Chakras & Channels', href: '/chakras' },
  { text: 'Founder of Sahaja Yoga', href: '/founder' },
  { text: 'About Sahaja Yoga', href: '/about' },
]

const heroLinks = [
  { text: 'Meditate Now', href: '/meditate' },
  { text: 'Music for meditation', href: '/music' },
  { text: 'Inspiration', href: '/inspiration' },
]

/**
 * FooterLinkList molecule for displaying lists of footer links with optional title.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Default Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <FooterLinkList
            title="Learn more"
            links={[
              { text: 'About Us', href: '/about' },
              { text: 'Contact', href: '/contact' },
            ]}
          />
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <FooterLinkList title="Learn more" links={sampleLinks} locale="en" />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Hero Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <FooterLinkList
            variant="hero"
            links={[
              { text: 'Meditate Now', href: '/meditate' },
              { text: 'Music for meditation', href: '/music' },
            ]}
          />
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <FooterLinkList variant="hero" links={heroLinks} locale="en" />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-12 md:flex-row md:gap-16">
        {/* Hero Links Section */}
        <div className="flex-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Hero Links (No Title)</h4>
          <FooterLinkList variant="hero" links={heroLinks} />
        </div>

        {/* Default Links Section */}
        <div className="flex-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Default Links (With Title)</h4>
          <FooterLinkList title="Come meditate" links={sampleLinks} />
        </div>

        {/* Another Default Section */}
        <div className="flex-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Another Section</h4>
          <FooterLinkList
            title="Resources"
            links={[
              { text: 'Classes Near Me', href: '/classes' },
              { text: 'Guided Meditations Online', href: '/guided' },
              { text: 'Live Online Classes', href: '/live' },
              { text: 'Privacy Notice', href: '/privacy' },
              { text: 'Contact Us', href: '/contact' },
            ]}
          />
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Footer Link List'
