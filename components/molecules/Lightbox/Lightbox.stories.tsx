import { useState } from 'react'
import type { Story, StoryDefault } from '@ladle/react'
import { Lightbox } from './Lightbox'
import type { LightboxSlide } from './LightboxProvider'
import { Button } from '../../atoms'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

const single: LightboxSlide[] = [
  {
    src: 'https://picsum.photos/seed/lightbox-hero/1600/1000',
    alt: 'Sunlight through a forest canopy',
    description: 'Sunlight through a forest canopy',
  },
]

const gallery: LightboxSlide[] = [
  {
    src: 'https://picsum.photos/seed/lightbox-1/1600/1000',
    alt: 'Misty mountain ridge',
    description: 'Misty mountain ridge at dawn',
  },
  {
    src: 'https://picsum.photos/seed/lightbox-2/1200/1600',
    alt: 'Still lake reflection',
    description: 'A still lake mirroring the sky',
  },
  {
    src: 'https://picsum.photos/seed/lightbox-3/1600/1066',
    alt: 'Desert dunes',
    description: 'Wind-sculpted desert dunes',
  },
  {
    src: 'https://picsum.photos/seed/lightbox-4/1600/900',
    alt: 'Quiet forest path',
    description: 'A quiet path winding through tall trees',
  },
]

/** Opens a lightbox from a button so its overlay, keyboard nav and zoom can be exercised. */
function LightboxDemo({ slides, label }: { slides: LightboxSlide[]; label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Lightbox close={() => setOpen(false)} index={0} open={open} slides={slides} />
    </>
  )
}

/**
 * Lightbox overlay, showcasing a single image (zoom and caption) and a
 * multi-image gallery (previous and next, ←/→ keys, a thumbnail strip,
 * per-slide captions, and scroll, double-click, or pinch zoom). Click a
 * button to open. Esc or the close button dismisses it.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="One slide: zoom and caption only — the thumbnail strip and prev/next arrows collapse."
      title="Single Image"
    >
      <LightboxDemo label="Open single image" slides={single} />
    </StorySection>

    <StorySection
      description="Several slides: prev/next arrows, ←/→ keys, a thumbnail strip and per-slide captions."
      title="Multi-Image Gallery"
    >
      <LightboxDemo label="Open gallery" slides={gallery} />
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          In rich-text content the gallery and inline images mount their own triggers automatically;
          here a button stands in for the trigger.
        </p>
        <LightboxDemo label="Open captioned gallery" slides={gallery} />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Lightbox'
