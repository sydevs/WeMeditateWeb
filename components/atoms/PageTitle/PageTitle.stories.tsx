import type { Story, StoryDefault } from '@ladle/react'
import { PageTitle } from './PageTitle'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Atoms',
} satisfies StoryDefault

/**
 * PageTitle displays a prominent page heading with an optional subtitle and decorative gradient.
 * Based on the `.banner` element from wemeditate.com with support for left, center, and right alignment.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Title Only</p>
          <PageTitle title="Meditate Now" />
        </div>
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">With Subtitle</p>
          <PageTitle
            subtitle="Calming tracks to enhance your practice"
            title="Music for Meditation"
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="Alignment">
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Left Aligned</p>
          <PageTitle
            align="left"
            subtitle="Calming tracks to enhance your practice"
            title="Music for Meditation"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Center Aligned (Default)</p>
          <PageTitle
            align="center"
            subtitle="Find your inner peace through guided meditation"
            title="Meditate Now"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Right Aligned</p>
          <PageTitle align="right" subtitle="Get in touch with us" title="Contact" />
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Page Title'
