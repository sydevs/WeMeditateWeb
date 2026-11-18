import type { Story, StoryDefault } from '@ladle/react'
import { Image } from './Image'
import { StorySection, StoryWrapper } from '../../ladle'

// Every <Image> declares the box its grid draws. The three-column grids are
// `max-w-4xl` with a 16px gap, so a cell caps at (896 - 32) / 3 = 288px; the
// two-column Examples grid is `max-w-2xl` with a 12px gap, (672 - 12) / 2 = 330px.
const THIRD_OF_4XL = '(min-width: 640px) 288px, 100vw'
const HALF_OF_2XL = '(min-width: 640px) 330px, 100vw'
const MAX_W_SM = '(min-width: 384px) 384px, 100vw'

export default {
  title: 'Atoms',
} satisfies StoryDefault

/**
 * Image component showcasing all aspect ratios, object fit options, placeholder states, and usage
 * in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Shapes">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <p className="text-sm text-gray-700 mb-2">Square (no rounding)</p>
          <Image
            alt="Square image"
            aspectRatio="square"
            rounded="square"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/40/600/600"
          />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Rounded (rounded-lg)</p>
          <Image
            alt="Rounded image"
            aspectRatio="square"
            rounded="rounded"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/40/600/600"
          />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Circle (rounded-full)</p>
          <Image
            alt="Circle image"
            aspectRatio="square"
            rounded="circle"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/40/600/600"
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="Aspect Ratios">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <p className="text-sm text-gray-700 mb-2">Square (1:1)</p>
          <Image
            alt="Square image"
            aspectRatio="square"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/10/400/400"
          />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Video (16:9)</p>
          <Image
            alt="Video aspect ratio"
            aspectRatio="video"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/10/1600/900"
          />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">4:3</p>
          <Image
            alt="4:3 aspect ratio"
            aspectRatio="4-3"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/10/800/600"
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="States">
      <StorySection
        description="A loaded image is opaque, with no placeholder over it. An absent src keeps the placeholder, so the layout still holds, and showLoading false drops even that."
        title="Placeholder"
        variant="subsection"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
          <Image
            alt="A loaded image"
            aspectRatio="4-3"
            sizes={THIRD_OF_4XL}
            src="https://picsum.photos/id/30/600/400"
          />
          <Image
            alt="No src, so the placeholder holds the box"
            aspectRatio="4-3"
            sizes={THIRD_OF_4XL}
            src=""
          />
          <Image
            alt="No src and no placeholder"
            aspectRatio="4-3"
            showLoading={false}
            sizes={THIRD_OF_4XL}
            src=""
          />
        </div>
      </StorySection>

      <StorySection
        description="A natural-flow image (forceAspectRatio false) whose load fails falls back to the aspectRatio it was given, so the error icon stays visible instead of collapsing the slot to 0px."
        title="Failed load"
        variant="subsection"
      >
        <div className="max-w-sm">
          <Image
            alt="A broken natural-flow image"
            aspectRatio="video"
            forceAspectRatio={false}
            sizes={MAX_W_SM}
            src="/this-image-does-not-exist.jpg"
          />
        </div>
      </StorySection>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <Image
          alt="Portrait meditation"
          aspectRatio="3-2"
          rounded="rounded"
          sizes={HALF_OF_2XL}
          src="https://picsum.photos/id/50/600/800"
        />
        <div className="flex flex-col gap-3">
          <Image
            alt="Landscape meditation"
            aspectRatio="3-2"
            rounded="rounded"
            sizes={HALF_OF_2XL}
            src="https://picsum.photos/id/51/600/400"
          />
          <Image
            alt="Another landscape"
            aspectRatio="3-2"
            rounded="rounded"
            sizes={HALF_OF_2XL}
            src="https://picsum.photos/id/52/600/400"
          />
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
)
Default.storyName = 'Image'
