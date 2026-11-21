import type { Story, StoryDefault } from '@ladle/react'
import { Author } from './Author'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

// Sample author image URL (same as Avatar stories)
const authorImage = 'https://picsum.photos/id/64/200/200'

/** Author molecule for displaying author information in mini (byline) or hero (bio) formats. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Mini Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <Author imageUrl={authorImage} name="Sarah Johnson" variant="mini" />
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <Author
            countryCode="FI"
            href="#author"
            imageUrl={authorImage}
            meditationYears={5}
            name="Gabriel Kolanen"
            readingTime={8}
            variant="mini"
          />
        </StorySection>

        <StorySection title="Maximal (Right Aligned)" variant="subsection">
          <Author
            align="right"
            countryCode="FI"
            href="#author"
            imageUrl={authorImage}
            meditationYears={5}
            name="Gabriel Kolanen"
            readingTime={8}
            variant="mini"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Hero Variant">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <Author
            countryCode="UK"
            imageUrl={authorImage}
            meditationYears={3}
            name="Emma Wilson"
            variant="hero"
          />
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <Author
            countryCode="FI"
            description={
              <>
                <p className="mb-4">
                  A student of boisterous books as much as bubbling brooks, Gabriel Kolanen is a
                  recent graduate of English Literature and History in Scotland. While spending one
                  half of his time digging through dusty tomes in the depths of the library, the
                  other half was spent traversing the terrific terrain of the North.
                </p>
                <p>
                  For him, the firsthand experience is where the potential for learning is at its
                  best, be it winding along a meandering river on a bright noon day, crossing the
                  crest of a mountain knee-deep in snow, or finding solace and silence in
                  meditation.
                </p>
              </>
            }
            imageUrl={authorImage}
            meditationYears={5}
            name="Gabriel Kolanen"
            title="Graduate of English Literature and History"
            variant="hero"
          />
        </StorySection>

        <StorySection title="Maximal (Right Aligned)" variant="subsection">
          <Author
            align="right"
            countryCode="FI"
            description={
              <>
                <p className="mb-4">
                  A student of boisterous books as much as bubbling brooks, Gabriel Kolanen is a
                  recent graduate of English Literature and History in Scotland. While spending one
                  half of his time digging through dusty tomes in the depths of the library, the
                  other half was spent traversing the terrific terrain of the North.
                </p>
                <p>
                  For him, the firsthand experience is where the potential for learning is at its
                  best, be it winding along a meandering river on a bright noon day, crossing the
                  crest of a mountain knee-deep in snow, or finding solace and silence in
                  meditation.
                </p>
              </>
            }
            imageUrl={authorImage}
            meditationYears={5}
            name="Gabriel Kolanen"
            title="Graduate of English Literature and History"
            variant="hero"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
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
                align="right"
                countryCode="FI"
                href="#author"
                imageUrl={authorImage}
                meditationYears={5}
                name="Gabriel Kolanen"
                readingTime={8}
                variant="mini"
              />
            </div>
            <p className="text-gray-700">
              In today's fast-paced world, finding moments of stillness can seem impossible. Yet,
              through the practice of meditation, we can discover a sanctuary of peace within
              ourselves, accessible at any moment...
            </p>
          </div>
        </article>
      </div>

      {/* Article Footer with Hero Bio */}
      <div className="mt-12">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Article Footer</h3>
        <div>
          <Author
            countryCode="FI"
            description={
              <>
                <p className="mb-4">
                  A student of boisterous books as much as bubbling brooks, Gabriel Kolanen is a
                  recent graduate of English Literature and History in Scotland. While spending one
                  half of his time digging through dusty tomes in the depths of the library, the
                  other half was spent traversing the terrific terrain of the North.
                </p>
                <p>
                  For him, the firsthand experience is where the potential for learning is at its
                  best, be it winding along a meandering river on a bright noon day, crossing the
                  crest of a mountain knee-deep in snow, or finding solace and silence in
                  meditation.
                </p>
              </>
            }
            imageUrl={authorImage}
            meditationYears={5}
            name="Gabriel Kolanen"
            title="Graduate of English Literature and History"
            variant="hero"
          />
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Author'
