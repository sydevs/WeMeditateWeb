import type { Story, StoryDefault } from "@ladle/react";
import { Image } from "./Image";
import { StorySection,
   StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Image component showcasing all aspect ratios, object fit options, loading states, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Shapes">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <p className="text-sm text-gray-600 mb-2">Square (no rounding)</p>
          <Image
            src="https://picsum.photos/id/40/600/600"
            alt="Square image"
            aspectRatio="square"
            rounded="square"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Rounded (rounded-lg)</p>
          <Image
            src="https://picsum.photos/id/40/600/600"
            alt="Rounded image"
            aspectRatio="square"
            rounded="rounded"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Circle (rounded-full)</p>
          <Image
            src="https://picsum.photos/id/40/600/600"
            alt="Circle image"
            aspectRatio="square"
            rounded="circle"
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="Aspect Ratios">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <p className="text-sm text-gray-600 mb-2">Square (1:1)</p>
          <Image
            src="https://picsum.photos/id/10/400/400"
            alt="Square image"
            aspectRatio="square"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Video (16:9)</p>
          <Image
            src="https://picsum.photos/id/10/1600/900"
            alt="Video aspect ratio"
            aspectRatio="video"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">4:3</p>
          <Image
            src="https://picsum.photos/id/10/800/600"
            alt="4:3 aspect ratio"
            aspectRatio="4/3"
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="States">
      <div>
        <p className="text-sm text-gray-600 mb-2">With Loading State</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
          <Image
            src="https://picsum.photos/id/30/600/400"
            alt="Image with loading"
            aspectRatio="4/3"
            showLoading
          />
          <Image
            src="https://picsum.photos/id/30/600/400"
            alt="Image with loading"
            aspectRatio="4/3"
            showLoading
          />
          <Image
            src="https://picsum.photos/id/30/600/400"
            alt="Image with loading"
            aspectRatio="4/3"
            showLoading
          />
        </div>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <Image
          src="https://picsum.photos/id/50/600/800"
          alt="Portrait meditation"
          aspectRatio="3/4"
          rounded="rounded"
        />
        <div className="flex flex-col gap-3">
          <Image
            src="https://picsum.photos/id/51/600/400"
            alt="Landscape meditation"
            aspectRatio="3/2"
            rounded="rounded"
          />
          <Image
            src="https://picsum.photos/id/52/600/400"
            alt="Another landscape"
            aspectRatio="3/2"
            rounded="rounded"
          />
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
);
Default.storyName = "Image"
