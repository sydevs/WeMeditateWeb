import type { Story, StoryDefault } from '@ladle/react'
import { PageTitle } from './PageTitle'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Atoms / Typography',
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
            title="Music for Meditation"
            subtitle="Calming tracks to enhance your practice"
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="Alignment">
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Left Aligned</p>
          <PageTitle title="Music for Meditation" subtitle="Calming tracks to enhance your practice" align="left" />
        </div>
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Center Aligned (Default)</p>
          <PageTitle
            title="Meditate Now"
            subtitle="Find your inner peace through guided meditation"
            align="center"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-3 text-gray-700">Right Aligned</p>
          <PageTitle title="Contact" subtitle="Get in touch with us" align="right" />
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Page Title'
