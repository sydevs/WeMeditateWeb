import type { Story, StoryDefault } from '@ladle/react'
import { TableOfContents } from './TableOfContents'
import { StoryWrapper, StorySection } from '../../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

/**
 * TableOfContents renders the `table-of-contents` block as anchor links to a
 * page's headings. Anchors are derived from each heading's text with the same
 * `slugify` the RichText heading converter uses, so they match the emitted
 * heading ids. Entries are indented by their level relative to the shallowest.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="With title">
      <TableOfContents
        headings={[
          { slug: 'when-to-do-it', text: 'When to do it?', level: 2 },
          { slug: 'at-the-beginning', text: 'At the beginning and end of meditation', level: 3 },
          { slug: 'how-to-do-it', text: 'How to do it?', level: 2 },
          { slug: 'why-does-it-work', text: 'Why does it work?', level: 2 },
        ]}
        title="Explore below"
      />
    </StorySection>

    <StorySection title="Without title">
      <TableOfContents
        headings={[
          { slug: 'introduction', text: 'Introduction', level: 2 },
          { slug: 'the-practice', text: 'The Practice', level: 2 },
          { slug: 'going-deeper', text: 'Going Deeper', level: 2 },
        ]}
      />
    </StorySection>

    <StorySection
      description="Headings are indented by their level relative to the shallowest one present."
      title="Nested levels"
    >
      <TableOfContents
        headings={[
          { slug: 'finding-stillness', text: 'Finding Stillness', level: 2 },
          { slug: 'posture', text: 'Posture', level: 3 },
          { slug: 'sitting', text: 'Sitting comfortably', level: 4 },
          { slug: 'the-breath', text: 'The Breath', level: 3 },
          { slug: 'a-daily-rhythm', text: 'A Daily Rhythm', level: 2 },
        ]}
        title="In this article"
      />
    </StorySection>

    <StorySection title="Single heading">
      <TableOfContents
        headings={[{ slug: 'overview', text: 'Overview', level: 2 }]}
        title="Contents"
      />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Table of Contents'
