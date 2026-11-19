import type { Story, StoryDefault } from '@ladle/react'
import { Blockquote } from './Blockquote'
import { Link } from '../Link'
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '../../ladle'

export default {
  title: 'Atoms',
} satisfies StoryDefault

/**
 * Blockquote atom for displaying floating quotes with gradient backgrounds.
 * Features alignment options with mirrored gradients and optional credit attribution.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Left</StoryGridHeaderCell>
            <StoryGridHeaderCell>Right</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>With Credit</StoryGridCell>
            <StoryGridCell>
              <Blockquote align="left" credit="Shri Mataji Nirmala Devi">
                This Kundalini is the spiritual mother of every individual.
              </Blockquote>
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote align="right" credit="Shri Mataji Nirmala Devi">
                This Kundalini is the spiritual mother of every individual.
              </Blockquote>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Without Credit</StoryGridCell>
            <StoryGridCell>
              <Blockquote align="left">
                Meditation is not a way of making your mind quiet. It is a way of entering into the
                quiet that is already there.
              </Blockquote>
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote align="right">
                Meditation is not a way of making your mind quiet. It is a way of entering into the
                quiet that is already there.
              </Blockquote>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Long Quote</StoryGridCell>
            <StoryGridCell>
              <Blockquote align="left" credit="Traditional Wisdom">
                The beauty of meditation is that it allows us to discover our inner self, to
                understand our true nature, and to find peace within the chaos of daily life.
                Through regular practice, we develop a deeper connection with ourselves.
              </Blockquote>
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote align="right" credit="Traditional Wisdom">
                The beauty of meditation is that it allows us to discover our inner self, to
                understand our true nature, and to find peace within the chaos of daily life.
                Through regular practice, we develop a deeper connection with ourselves.
              </Blockquote>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Inline Content</StoryGridCell>
            <StoryGridCell>
              <Blockquote align="left">
                The quieter you become, the <strong>more</strong> you hear.
                <br />
                Read about <Link href="/kundalini">the Kundalini</Link>.
              </Blockquote>
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote align="right">
                The quieter you become, the <strong>more</strong> you hear.
                <br />
                Read about <Link href="/kundalini">the Kundalini</Link>.
              </Blockquote>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <article className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Understanding the Subtle System
        </h1>
        <p className="text-gray-700 mb-6">
          The subtle system is the intricate network of energy channels and centers within us.
          At the base of this system lies the Kundalini, a dormant spiritual energy that,
          when awakened, rises through the chakras to unite us with our higher consciousness.
        </p>
        <Blockquote align="right" className="my-6 ml-6" credit="Shri Mataji Nirmala Devi">
          This Kundalini is the spiritual mother of every individual.
        </Blockquote>
        <p className="text-gray-700 mt-6">
          This profound energy is present in all of us, waiting to be awakened through meditation.
          When activated, it brings about a transformation that affects every aspect of our being.
        </p>
        <p className="text-gray-700 mt-6">
          Many people believe that meditation requires silencing the mind completely, but this
          is a misconception. Instead, meditation is about discovering the stillness that exists
          beneath the noise of our thoughts. This subtle distinction is important for anyone
          beginning their meditation practice.
        </p>
        <p className="text-gray-700 mt-6">
          Many people believe that meditation requires silencing the mind completely, but this
          is a misconception. Instead, meditation is about discovering the stillness that exists
          beneath the noise of our thoughts. This subtle distinction is important for anyone
          beginning their meditation practice.
        </p>
        <Blockquote align="left" className="my-6 mr-6" credit="Deepak Chopra">
          Meditation is not a way of making your mind quiet. It is a way of entering into the quiet
          that is already there.
        </Blockquote>
        <p className="text-gray-700 mt-4">
          As we continue our practice, we learn to access this inner quietude more easily,
          finding that it becomes a refuge we can return to whenever we need clarity or peace.
        </p>
        <p className="text-gray-700 mt-4">
          As we continue our practice, we learn to access this inner quietude more easily,
          finding that it becomes a refuge we can return to whenever we need clarity or peace.
        </p>
      </article>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Blockquote'
