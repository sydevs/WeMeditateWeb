import type { Story, StoryDefault } from "@ladle/react"
import { ColumnCarousel } from "./ColumnCarousel"
import { StoryWrapper, StorySection, StoryExampleSection } from '../../ladle'

export default {
  title: "Molecules / Sections"
} satisfies StoryDefault

/**
 * ColumnCarousel molecule for displaying columns in a responsive layout.
 *
 * Responsive behavior based on column count:
 * - Mobile (< 768px): Carousel for 3+ columns, stacked for 1-2 columns
 * - Tablet (768px-1024px): Carousel for 4+ columns, flex row for 1-3 columns
 * - Desktop (≥ 1024px): Flex row for all column counts
 *
 * Maximum 5 columns allowed.
 */
export const Default: Story = () => {
  const threeColumns = [
    {
      title: "Left Aspect",
      description: (
        <>
          <p className="mb-4">
            The left side manifestation of our Vishuddhi is in the form of self respect. When our self-esteem is low, it is difficult to respect ourselves and give ourselves the credit we deserve. Thus we can easily feel guilty for our mistakes, carrying them with us and allowing them to further erode our self-esteem.
          </p>
          <p>
            To avoid guilt and unblock this chakra it is important to face our mistakes, to accept the lessons we still need to learn, and to move on.
          </p>
        </>
      ),
      imageUrl: "https://picsum.photos/id/64/200/200",
      imageAlt: "Left aspect symbol",
    },
    {
      title: "Central Aspect",
      description: (
        <>
          <p className="mb-4">
            The main qualities the central Vishuddhi chakra are a sense of collectivity and a state of a detached witness. Once awakened, this centre also gives us a sense of discretion of when to speak and what to say.
          </p>
          <p className="mb-4">
            Humans as social creatures have always sought to associate themselves with a tribe, nation, or land, but true collectivity is when we go beyond these man-made differences.
          </p>
          <p>
            This can only come from an open heart and relationships based on sweetness and enjoyment of one another. In such a state, we understand life to be a play we learn to enjoy it in a detached manner as one would witness a play in the theatre.
          </p>
        </>
      ),
      imageUrl: "https://picsum.photos/id/65/200/200",
      imageAlt: "Central aspect symbol",
    },
    {
      title: "Right Aspect",
      description: (
        <>
          <p className="mb-4">
            The right Vishuddhi chakra is responsible for how we communicate with others. An individual with a strong centre is one that speaks sweetly and shows a respect for others in their speech. This chakra is known as the centre of diplomacy.
          </p>
          <p className="mb-4">
            Diplomacy does not mean we do not express ourselves honestly, it simply means we are careful in the words we choose so as not to cause offence or upset to others.
          </p>
          <p>
            Having a tongue sweet like honey is the expression used for those who manifest this quality.
          </p>
        </>
      ),
      imageUrl: "https://picsum.photos/id/66/200/200",
      imageAlt: "Right aspect symbol",
    },
  ]

  const fiveColumns = [
    {
      title: "Foundation",
      description: "The foundation of meditation practice begins with finding a quiet space and comfortable posture. Regular practice, even just 5-10 minutes daily, helps establish the habit.",
      imageUrl: "https://picsum.photos/id/70/200/200",
      imageAlt: "Foundation",
    },
    {
      title: "Awareness",
      description: "Developing awareness of your thoughts, emotions, and bodily sensations without judgment is key. Notice what arises in your consciousness with curiosity and acceptance.",
      imageUrl: "https://picsum.photos/id/71/200/200",
      imageAlt: "Awareness",
    },
    {
      title: "Breath",
      description: "The breath serves as an anchor, bringing you back to the present moment whenever the mind wanders. Focus on the natural rhythm of inhalation and exhalation.",
      imageUrl: "https://picsum.photos/id/72/200/200",
      imageAlt: "Breath",
    },
    {
      title: "Stillness",
      description: "As practice deepens, moments of true stillness emerge. In this state of quiet awareness, you experience peace beyond thought and connect with your deeper self.",
      imageUrl: "https://picsum.photos/id/73/200/200",
      imageAlt: "Stillness",
    },
    {
      title: "Integration",
      description: "The final stage is bringing meditation into daily life. The peace and clarity cultivated on the cushion naturally flows into everyday activities and relationships.",
      imageUrl: "https://picsum.photos/id/74/200/200",
      imageAlt: "Integration",
    },
  ]

  const twoColumns = [
    {
      title: "Morning Practice",
      description: (
        <>
          <p className="mb-4">
            Start your day with a brief meditation to set a positive tone. Morning practice helps clear the mind, reduce anxiety, and increase focus for the day ahead.
          </p>
          <p>
            Even 5 minutes can make a significant difference in your mental clarity and emotional balance throughout the day.
          </p>
        </>
      ),
      imageUrl: "https://picsum.photos/id/75/200/200",
      imageAlt: "Morning meditation",
    },
    {
      title: "Evening Practice",
      description: (
        <>
          <p className="mb-4">
            End your day with meditation to release stress and prepare for restful sleep. Evening practice helps process the day's experiences and let go of tension.
          </p>
          <p>
            This practice promotes better sleep quality and helps you wake up feeling more refreshed and centered.
          </p>
        </>
      ),
      imageUrl: "https://picsum.photos/id/76/200/200",
      imageAlt: "Evening meditation",
    },
  ]

  const oneColumn = [
    {
      title: "Meditation Journey",
      description: (
        <>
          <p className="mb-4">
            Meditation is a profound journey inward, a practice that has been cultivated for thousands of years across cultures and traditions. It offers a pathway to inner peace, self-discovery, and spiritual awakening.
          </p>
          <p className="mb-4">
            Through regular practice, we learn to quiet the constant chatter of the mind and connect with a deeper sense of awareness. This awareness is always present, like the sky behind the clouds, waiting to be recognized.
          </p>
          <p>
            Whether you're just beginning or have practiced for years, each meditation session offers something new. Approach your practice with patience, curiosity, and self-compassion, allowing the benefits to unfold naturally over time.
          </p>
        </>
      ),
      imageUrl: "https://picsum.photos/id/85/200/200",
      imageAlt: "Meditation journey",
    },
  ]

  return (
    <StoryWrapper>
      <StorySection title="Three Columns (Classic)">
        <ColumnCarousel columns={threeColumns} />
      </StorySection>

      <StorySection title="Five Columns">
        <ColumnCarousel columns={fiveColumns} />
      </StorySection>

      <StorySection title="Two Columns (Stacked on Mobile)">
        <p className="text-sm text-gray-600 mb-4">
          With 1-2 columns, mobile displays them stacked vertically (no carousel).
        </p>
        <ColumnCarousel columns={twoColumns} />
      </StorySection>

      <StorySection title="One Column">
        <p className="text-sm text-gray-600 mb-4">
          Single column displays as a simple centered layout on all screen sizes.
        </p>
        <ColumnCarousel columns={oneColumn} />
      </StorySection>

      <StoryExampleSection subtitle="With Linked Titles">
        <p className="text-sm text-gray-600 mb-4">
          Columns can have clickable titles that link to other pages.
        </p>
        <ColumnCarousel
          columns={[
            {
              title: "Silence",
              description: "In silence, we discover the space between thoughts where true peace resides. This quiet awareness is always present, waiting beneath the noise of daily life.",
              imageUrl: "https://picsum.photos/id/90/200/200",
              imageAlt: "Silence",
              href: "#",
            },
            {
              title: "Presence",
              description: "Being fully present means releasing attachment to past and future. In this moment, right here and now, everything we need is already available to us.",
              imageUrl: "https://picsum.photos/id/91/200/200",
              imageAlt: "Presence",
              href: "#",
            },
            {
              title: "Acceptance",
              description: "True acceptance means embracing what is, without resistance or judgment. This doesn't mean passivity, but rather a clear seeing that allows wise action.",
              imageUrl: "https://picsum.photos/id/92/200/200",
              imageAlt: "Acceptance",
              href: "#",
            },
          ]}
        />
      </StoryExampleSection>

      <StoryExampleSection subtitle="Without Images">
        <ColumnCarousel
          columns={[
            {
              title: "Body",
              description: "Our body is the vessel through which we experience the physical world. Caring for it with proper nutrition, exercise, and rest creates a strong foundation for meditation practice.",
            },
            {
              title: "Mind",
              description: "The mind is a powerful tool that can either serve us or create suffering. Through meditation, we learn to observe our thoughts without attachment, finding freedom from mental patterns.",
            },
            {
              title: "Spirit",
              description: "Spirit represents our deeper essence, the unchanging awareness that witnesses all experience. Meditation helps us connect with this spiritual dimension of our being.",
            },
          ]}
        />
      </StoryExampleSection>

      <StoryExampleSection subtitle="With Long Titles">
        <ColumnCarousel
          columns={[
            {
              title: "The Practice of Deep Contemplative Meditation",
              description: "This practice involves extended periods of focused attention, leading to profound states of inner stillness and insight.",
              imageUrl: "https://picsum.photos/id/80/200/200",
              imageAlt: "Deep meditation",
            },
            {
              title: "Understanding the Subtle Energy System",
              description: "The subtle energy system consists of chakras and channels through which life force flows, influencing our physical, mental, and spiritual well-being.",
              imageUrl: "https://picsum.photos/id/81/200/200",
              imageAlt: "Energy system",
            },
            {
              title: "Integrating Mindfulness into Daily Activities",
              description: "Mindfulness practice extends beyond formal meditation, bringing awareness and presence to everyday tasks like eating, walking, and working.",
              imageUrl: "https://picsum.photos/id/82/200/200",
              imageAlt: "Daily mindfulness",
            },
          ]}
        />
      </StoryExampleSection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = "Column Carousel"
