import type { Story, StoryDefault } from '@ladle/react'
import { PageTitle } from './PageTitle'
import { StoryWrapper, StorySection, StorySubsection, StoryExampleSection } from '../../ladle'

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
          <StorySubsection label="Title Only" />
          <PageTitle title="Meditate Now" />
        </div>
        <div>
          <StorySubsection label="With Subtitle" />
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
          <StorySubsection label="Left Aligned" />
          <PageTitle title="Music for Meditation" subtitle="Calming tracks to enhance your practice" align="left" />
        </div>
        <div>
          <StorySubsection label="Center Aligned (Default)" />
          <PageTitle
            title="Meditate Now"
            subtitle="Find your inner peace through guided meditation"
            align="center"
          />
        </div>
        <div>
          <StorySubsection label="Right Aligned" />
          <PageTitle title="Contact" subtitle="Get in touch with us" align="right" />
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Page Title'
