import type { Story, StoryDefault } from '@ladle/react'
import { OrnateTextBox } from './OrnateTextBox'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * OrnateTextBox organism — the decorative "Ancient Wisdom" treatment: a warm
 * parchment surface with a soft gradient, faded botanical flourishes, and a
 * vertical sidetext label. Mirrors wemeditate.com's `.cb-image-textbox--ornate`.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Alignments">
      <div className="flex flex-col gap-16">
        <StorySection title="Left Aligned (Default)" variant="subsection">
          <OrnateTextBox
            align="left"
            ctaHref="#"
            ctaText="Explore the teachings"
            description="In every culture and religion, one can find great tales of the immense power of a mother's love and the lengths she will go to protect her children. It is this deep sense of love which gives a child security in their heart and removes their fears."
            imageAlt="Ancient meditation artwork"
            imageHeight={1200}
            imageSrc="https://picsum.photos/seed/ornate-left/900/1200"
            imageWidth={900}
            subtitle="Timeless teachings"
            title="A Mother's Love"
          />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <OrnateTextBox
            align="right"
            ctaHref="#"
            ctaText="Read more"
            description="For thousands of years, seekers have turned inward to discover a deeper truth. This knowledge, passed down through generations, remains as relevant today as it ever was."
            imageAlt="Ancient manuscript"
            imageHeight={1200}
            imageSrc="https://picsum.photos/seed/ornate-right/900/1200"
            imageWidth={900}
            subtitle="Sacred knowledge"
            title="Ancient Wisdom"
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection
      description="The vertical sidetext label is decorative and customisable; it defaults to 'Ancient Wisdom'."
      title="Custom Sidetext"
    >
      <OrnateTextBox
        align="left"
        description="A fearsome yet compassionate figure, the great warrior mother fights tirelessly to free her children from the evils of ego, fear and desire."
        imageAlt="Goddess Durga artwork"
        imageHeight={1200}
        imageSrc="https://picsum.photos/seed/ornate-sidetext/900/1200"
        imageWidth={900}
        sidetext="Ancient Knowledge"
        title="The Warrior Mother"
      />
    </StorySection>

    <StorySection inContext={true} title="Without CTA or Subtitle">
      <OrnateTextBox
        align="left"
        description="While the stories recounted in sacred texts do not resemble the modern world, we all still fight our own battles daily. With the motherly love of our Kundalini we are empowered to overcome our inner demons."
        imageAlt="Meditative scene"
        imageHeight={1200}
        imageSrc="https://picsum.photos/seed/ornate-minimal/900/1200"
        imageWidth={900}
        title="Inner Battles"
      />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Ornate Text Box'
