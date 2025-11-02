import type { Story, StoryDefault } from '@ladle/react'
import { Blockquote } from './Blockquote'
import {
  StoryWrapper,
  StorySection,
  StoryExampleSection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '../../ladle'

export default {
  title: 'Atoms / Typography',
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
              <Blockquote
                align="left"
                text="This Kundalini is the spiritual mother of every individual."
                credit="Shri Mataji Nirmala Devi"
              />
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote
                align="right"
                text="This Kundalini is the spiritual mother of every individual."
                credit="Shri Mataji Nirmala Devi"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Without Credit</StoryGridCell>
            <StoryGridCell>
              <Blockquote
                align="left"
                text="Meditation is not a way of making your mind quiet. It is a way of entering into the quiet that is already there."
              />
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote
                align="right"
                text="Meditation is not a way of making your mind quiet. It is a way of entering into the quiet that is already there."
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Long Quote</StoryGridCell>
            <StoryGridCell>
              <Blockquote
                align="left"
                text="The beauty of meditation is that it allows us to discover our inner self, to understand our true nature, and to find peace within the chaos of daily life. Through regular practice, we develop a deeper connection with ourselves."
                credit="Traditional Wisdom"
              />
            </StoryGridCell>
            <StoryGridCell>
              <Blockquote
                align="right"
                text="The beauty of meditation is that it allows us to discover our inner self, to understand our true nature, and to find peace within the chaos of daily life. Through regular practice, we develop a deeper connection with ourselves."
                credit="Traditional Wisdom"
              />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StoryExampleSection>
      <article className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Understanding the Subtle System
        </h1>
        <p className="text-gray-700 mb-6">
          The subtle system is the intricate network of energy channels and centers within us.
          At the base of this system lies the Kundalini, a dormant spiritual energy that,
          when awakened, rises through the chakras to unite us with our higher consciousness.
        </p>
        <Blockquote
          align="right"
          text="This Kundalini is the spiritual mother of every individual."
          credit="Shri Mataji Nirmala Devi"
          className="my-6 ml-6"
        />
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
        <Blockquote
          align="left"
          text="Meditation is not a way of making your mind quiet. It is a way of entering into the quiet that is already there."
          credit="Deepak Chopra"
          className="my-6 mr-6"
        />
        <p className="text-gray-700 mt-4">
          As we continue our practice, we learn to access this inner quietude more easily,
          finding that it becomes a refuge we can return to whenever we need clarity or peace.
        </p>
        <p className="text-gray-700 mt-4">
          As we continue our practice, we learn to access this inner quietude more easily,
          finding that it becomes a refuge we can return to whenever we need clarity or peace.
        </p>
      </article>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Blockquote'
