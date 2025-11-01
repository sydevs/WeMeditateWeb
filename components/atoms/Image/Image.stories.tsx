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
            src="https://placehold.co/400x400/61aaa0/white?text=Square"
            alt="Square image"
            aspectRatio="square"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Video (16:9)</p>
          <Image
            src="https://placehold.co/1600x900/e08e79/white?text=Video"
            alt="Video aspect ratio"
            aspectRatio="video"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">4:3</p>
          <Image
            src="https://placehold.co/800x600/4a5568/white?text=4:3"
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
            src="https://placehold.co/800x400/61aaa0/white?text=Cover"
            alt="Object fit cover"
            aspectRatio="square"
            objectFit="cover"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Contain</p>
          <Image
            src="https://placehold.co/800x400/e08e79/white?text=Contain"
            alt="Object fit contain"
            aspectRatio="square"
            objectFit="contain"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Fill</p>
          <Image
            src="https://placehold.co/800x400/4a5568/white?text=Fill"
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
          src="https://placehold.co/600x400/61aaa0/white?text=Loading"
          alt="Image with loading"
          aspectRatio="4/3"
          showLoading
        />
        <Image
          src="https://placehold.co/600x400/e08e79/white?text=Loading"
          alt="Image with loading"
          aspectRatio="4/3"
          showLoading
        />
        <Image
          src="https://placehold.co/600x400/4a5568/white?text=Loading"
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
        <Image
          src="https://placehold.co/600x600/61aaa0/white?text=Rounded"
          alt="Rounded image"
          aspectRatio="square"
          className="rounded-lg"
        />
        <Image
          src="https://placehold.co/600x600/e08e79/white?text=Rounded-xl"
          alt="Extra rounded image"
          aspectRatio="square"
          className="rounded-xl"
        />
        <Image
          src="https://placehold.co/600x600/4a5568/white?text=Rounded-full"
          alt="Circle image"
          aspectRatio="square"
          className="rounded-full"
        />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Article Header</h3>
      <article className="max-w-3xl">
        <Image
          src="https://placehold.co/1200x675/61aaa0/white?text=Meditation+Garden"
          alt="Peaceful meditation garden"
          aspectRatio="16/9"
          className="rounded-lg mb-4"
        />
        <h2 className="text-2xl font-semibold mb-2 text-gray-900">Finding Peace in Nature</h2>
        <p className="text-gray-700">
          Discover how connecting with nature can deepen your meditation practice
          and bring a sense of calm to your daily life.
        </p>
      </article>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Meditation Card Grid</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: "Morning Meditation", color: "61aaa0" },
          { title: "Evening Practice", color: "e08e79" },
          { title: "Chakra Balance", color: "4a5568" },
        ].map((item) => (
          <div key={item.title} className="border border-gray-200 rounded-lg overflow-hidden hover:border-teal-500 transition-colors">
            <Image
              src={`https://placehold.co/400x300/${item.color}/white?text=${item.title.replace(" ", "+")}`}
              alt={item.title}
              aspectRatio="4/3"
            />
            <div className="p-3">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Gallery Layout</h3>
      <div className="grid grid-cols-2 gap-3">
        <Image
          src="https://placehold.co/600x800/61aaa0/white?text=Portrait"
          alt="Portrait meditation"
          aspectRatio="3/4"
          className="rounded"
        />
        <div className="flex flex-col gap-3">
          <Image
            src="https://placehold.co/600x400/e08e79/white?text=Landscape"
            alt="Landscape meditation"
            aspectRatio="3/2"
            className="rounded"
          />
          <Image
            src="https://placehold.co/600x400/4a5568/white?text=Landscape"
            alt="Another landscape"
            aspectRatio="3/2"
            className="rounded"
          />
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Image"
