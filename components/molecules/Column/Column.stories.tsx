import type { Story, StoryDefault } from "@ladle/react"
import { Column } from "./Column"
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: "Molecules / Content"
} satisfies StoryDefault

/**
 * Column component for displaying content in a vertical layout with optional image, title, and description.
 * Designed to be used within multi-column grid layouts.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="With Image">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <div className="max-w-sm">
            <Column
              title="Left Aspect"
              description="The left side manifestation of our Vishuddhi is in the form of self respect."
              imageUrl="https://picsum.photos/id/64/200/200"
              imageAlt="Decorative icon"
            />
          </div>
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <div className="max-w-sm">
            <Column
              title="Central Aspect"
              description={
                <>
                  <p className="mb-4">
                    The main qualities the central Vishuddhi chakra are a sense of collectivity and a state of a detached witness.
                  </p>
                  <p className="mb-4">
                    Once awakened, this centre also gives us a sense of discretion of when to speak and what to say.
                  </p>
                  <p>
                    Humans as social creatures have always sought to associate themselves with a tribe, nation, or land, but true collectivity is when we go beyond these man-made differences.
                  </p>
                </>
              }
              imageUrl="https://picsum.photos/id/64/200/200"
              imageAlt="Decorative icon"
              href="/subtle-system/vishuddhi-chakra"
            />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Without Image">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal" variant="subsection">
          <div className="max-w-sm">
            <Column
              title="Right Aspect"
              description="The right Vishuddhi chakra is responsible for how we communicate with others."
            />
          </div>
        </StorySection>

        <StorySection title="Maximal" variant="subsection">
          <div className="max-w-sm">
            <Column
              title="Diplomacy"
              description={
                <>
                  <p className="mb-4">
                    Diplomacy does not mean we do not express ourselves honestly, it simply means we are careful in the words we choose so as not to cause offence or upset to others.
                  </p>
                  <p>
                    Having a tongue sweet like honey is the expression used for those who manifest this quality.
                  </p>
                </>
              }
              href="/techniques/diplomacy"
            />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-12">
        <StorySection title="Three Column Layout" variant="subsection">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Column
              title="Left Aspect"
              description="The left side manifestation of our Vishuddhi is in the form of self respect. When our self-esteem is low, it is difficult to respect ourselves and give ourselves the credit we deserve."
              imageUrl="https://picsum.photos/id/64/200/200"
              imageAlt="Left aspect icon"
            />
            <Column
              title="Central Aspect"
              description="The main qualities the central Vishuddhi chakra are a sense of collectivity and a state of a detached witness. Once awakened, this centre also gives us a sense of discretion of when to speak and what to say."
              imageUrl="https://picsum.photos/id/65/200/200"
              imageAlt="Central aspect icon"
              href="/subtle-system/vishuddhi-chakra"
            />
            <Column
              title="Right Aspect"
              description="The right Vishuddhi chakra is responsible for how we communicate with others. An individual with a strong centre is one that speaks sweetly and shows a respect for others in their speech."
              imageUrl="https://picsum.photos/id/66/200/200"
              imageAlt="Right aspect icon"
            />
          </div>
        </StorySection>

        <StorySection title="Two Column Layout" variant="subsection">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Column
              title="Meditation Benefits"
              description={
                <>
                  <p className="mb-4">
                    Meditation helps reduce stress and anxiety, improve focus and concentration, and promote emotional well-being.
                  </p>
                  <p>
                    Regular practice can lead to better sleep, increased self-awareness, and a greater sense of inner peace.
                  </p>
                </>
              }
              imageUrl="https://picsum.photos/id/67/200/200"
              imageAlt="Meditation benefits"
              href="/benefits"
            />
            <Column
              title="Getting Started"
              description={
                <>
                  <p className="mb-4">
                    Begin with just 5-10 minutes a day in a quiet, comfortable space. Sit with your back straight and focus on your breath.
                  </p>
                  <p>
                    As you progress, you can gradually increase the duration and explore different meditation techniques.
                  </p>
                </>
              }
              imageUrl="https://picsum.photos/id/68/200/200"
              imageAlt="Getting started"
              href="/getting-started"
            />
          </div>
        </StorySection>

        <StorySection title="Text-Only Columns" variant="subsection">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Column
              title="Simple"
              description="A straightforward column with just a title and description, no image needed."
            />
            <Column
              title="Linked"
              description="This column has a clickable title that leads to more detailed information about the topic."
              href="/learn-more"
            />
            <Column
              title="Multi-paragraph"
              description={
                <>
                  <p className="mb-4">First paragraph with important information.</p>
                  <p className="mb-4">Second paragraph with additional details.</p>
                  <p>Final paragraph to wrap up the content.</p>
                </>
              }
            />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = "Column"
