import type { Story, StoryDefault } from '@ladle/react'
import { Author } from './Author'
import {
  StoryWrapper,
  StorySection,
  StorySubsection,
  StoryExampleSection,
} from '../../ladle'

export default {
  title: 'Molecules / Author',
} satisfies StoryDefault

// Sample author image URL (same as Avatar stories)
const authorImage = 'https://picsum.photos/id/64/200/200'

/**
 * Author molecule for displaying author information in mini (byline) or hero (bio) formats.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Mini Variant">
      <div className="flex flex-col gap-8">
        <StorySubsection label="Minimal">
          <Author
            variant="mini"
            name="Sarah Johnson"
            imageUrl={authorImage}
          />
        </StorySubsection>

        <StorySubsection label="Maximal">
          <Author
            variant="mini"
            name="Gabriel Kolanen"
            countryCode="FI"
            imageUrl={authorImage}
            meditationYears={5}
            readingTime={8}
            href="#author"
          />
        </StorySubsection>

        <StorySubsection label="Maximal (Right Aligned)">
          <Author
            variant="mini"
            name="Gabriel Kolanen"
            countryCode="FI"
            imageUrl={authorImage}
            meditationYears={5}
            readingTime={8}
            href="#author"
            align="right"
          />
        </StorySubsection>
      </div>
    </StorySection>

    <StorySection title="Hero Variant">
      <div className="flex flex-col gap-8">
        <StorySubsection label="Minimal">
          <Author
            variant="hero"
            name="Emma Wilson"
            countryCode="UK"
            imageUrl={authorImage}
            meditationYears={3}
          />
        </StorySubsection>

        <StorySubsection label="Maximal">
          <Author
            variant="hero"
            name="Gabriel Kolanen"
            countryCode="FI"
            imageUrl={authorImage}
            title="Graduate of English Literature and History"
            meditationYears={5}
            description={
              <>
                <p className="mb-4">
                  A student of boisterous books as much as bubbling brooks, Gabriel Kolanen is a recent graduate
                  of English Literature and History in Scotland. While spending one half of his time digging through
                  dusty tomes in the depths of the library, the other half was spent traversing the terrific terrain
                  of the North.
                </p>
                <p>
                  For him, the firsthand experience is where the potential for learning is at its best, be it winding
                  along a meandering river on a bright noon day, crossing the crest of a mountain knee-deep in snow,
                  or finding solace and silence in meditation.
                </p>
              </>
            }
          />
        </StorySubsection>

        <StorySubsection label="Maximal (Right Aligned)">
          <Author
            variant="hero"
            name="Gabriel Kolanen"
            countryCode="FI"
            imageUrl={authorImage}
            title="Graduate of English Literature and History"
            meditationYears={5}
            align="right"
            description={
              <>
                <p className="mb-4">
                  A student of boisterous books as much as bubbling brooks, Gabriel Kolanen is a recent graduate
                  of English Literature and History in Scotland. While spending one half of his time digging through
                  dusty tomes in the depths of the library, the other half was spent traversing the terrific terrain
                  of the North.
                </p>
                <p>
                  For him, the firsthand experience is where the potential for learning is at its best, be it winding
                  along a meandering river on a bright noon day, crossing the crest of a mountain knee-deep in snow,
                  or finding solace and silence in meditation.
                </p>
              </>
            }
          />
        </StorySubsection>
      </div>
    </StorySection>

    <StoryExampleSection>
      {/* Article with Mini Byline */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Article Header</h3>
        <article className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            The Art of Being Present: A Journey Through Meditation
          </h1>
          <div className="clear-both after:content-[''] after:table after:clear-both">
            <div className="float-right ml-3">
              <Author
                variant="mini"
                name="Gabriel Kolanen"
                countryCode="FI"
                imageUrl={authorImage}
                meditationYears={5}
                readingTime={8}
                href="#author"
                align="right"
              />
            </div>
            <p className="text-gray-700">
              In today's fast-paced world, finding moments of stillness can seem impossible.
              Yet, through the practice of meditation, we can discover a sanctuary of peace
              within ourselves, accessible at any moment...
            </p>
          </div>
        </article>
      </div>

      {/* Article Footer with Hero Bio */}
      <div className="mt-12">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Article Footer</h3>
        <div>
          <Author
            variant="hero"
            name="Gabriel Kolanen"
            countryCode="FI"
            imageUrl={authorImage}
            title="Graduate of English Literature and History"
            meditationYears={5}
            description={
              <>
                <p className="mb-4">
                  A student of boisterous books as much as bubbling brooks, Gabriel Kolanen is a recent graduate
                  of English Literature and History in Scotland. While spending one half of his time digging through
                  dusty tomes in the depths of the library, the other half was spent traversing the terrific terrain
                  of the North.
                </p>
                <p>
                  For him, the firsthand experience is where the potential for learning is at its best, be it winding
                  along a meandering river on a bright noon day, crossing the crest of a mountain knee-deep in snow,
                  or finding solace and silence in meditation.
                </p>
              </>
            }
          />
        </div>
      </div>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Author'
