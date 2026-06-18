import type { Story, StoryDefault } from '@ladle/react'
import { OrnateTextBox } from './OrnateTextBox'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * OrnateTextBox organism — the decorative "Ancient Wisdom" treatment: a
 * full-width warm-brown ground with a soft gradient, a faded floral graphic,
 * and a vertical sidetext label. Mirrors wemeditate.com's
 * `.cb-image-textbox--ornate`.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Default">
      <OrnateTextBox
        description={
          "In every culture and religion, one can find great tales of the immense power of a mother's love and the lengths that she will go to in order to protect her children. It is this deep sense of love which gives a child security in their heart and removes their fears.\n\n" +
          'In Hinduism, the goddess Durga is the great warrior mother who defeats all the enemies of her children. A fearsome, yet extremely compassionate figure who rides on a tiger yielding great weapons with her many arms, she fights tirelessly to free her children from the evils of ego, fears and desires.\n\n' +
          'While the stories recounted in these sacred texts do not appear to resemble any modern scene of the world today, we all still fight our own battles on a daily basis. With the motherly love of our Kundalini we are empowered to overcome all of our inner demons.'
        }
        imageAlt="Ancient meditation artwork"
        imageHeight={900}
        imageSrc="https://picsum.photos/seed/ornate-left/1200/900"
        imageWidth={1200}
        sidetext="Ancient Knowledge"
        title="A Mother's Love"
      />
    </StorySection>

    <StorySection
      description="An optional subtitle sits under the title; the sidetext label is decorative and customisable (defaults to 'Ancient Wisdom')."
      title="With Subtitle & CTA"
    >
      <OrnateTextBox
        ctaHref="#"
        ctaText="Read more"
        description="For thousands of years, seekers have turned inward to discover a deeper truth. This knowledge, passed down through generations, remains as relevant today as it ever was."
        imageAlt="Goddess Durga artwork"
        imageHeight={900}
        imageSrc="https://picsum.photos/seed/ornate-sidetext/1200/900"
        imageWidth={1200}
        subtitle="Sacred knowledge"
        title="The Warrior Mother"
      />
    </StorySection>

    <StorySection inContext={true} title="Without CTA or Subtitle">
      <OrnateTextBox
        description="While the stories recounted in sacred texts do not resemble the modern world, we all still fight our own battles daily. With the motherly love of our Kundalini we are empowered to overcome our inner demons."
        imageAlt="Meditative scene"
        imageHeight={900}
        imageSrc="https://picsum.photos/seed/ornate-minimal/1200/900"
        imageWidth={1200}
        title="Inner Battles"
      />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Ornate Text Box'
