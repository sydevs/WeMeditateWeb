import type { Story, StoryDefault } from "@ladle/react";
import { Image } from "./Image";

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Image component showcasing all aspect ratios, object fit options, loading states, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Aspect Ratios</h3>
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
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
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Object Fit Options</h3>
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        <div>
          <p className="text-sm text-gray-600 mb-2">Cover (default)</p>
          <Image
            src="https://picsum.photos/id/20/800/400"
            alt="Object fit cover"
            aspectRatio="square"
            objectFit="cover"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Contain</p>
          <Image
            src="https://picsum.photos/id/20/800/400"
            alt="Object fit contain"
            aspectRatio="square"
            objectFit="contain"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Fill</p>
          <Image
            src="https://picsum.photos/id/20/800/400"
            alt="Object fit fill"
            aspectRatio="square"
            objectFit="fill"
          />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Loading State</h3>
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
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

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Rounded Corners</h3>
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
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
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Gallery Layout</h3>
      <div className="grid grid-cols-2 gap-3">
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
    </div>
  </div>
);
Default.storyName = "Image"
