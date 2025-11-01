import type { Story, StoryDefault } from "@ladle/react";
import { Avatar } from "./Avatar";

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Avatar component showcasing all sizes, shapes, images, fallback initials, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar size="xs" alt="John Doe" />
          <p className="text-sm text-gray-600">xs</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="sm" alt="John Doe" />
          <p className="text-sm text-gray-600">sm</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="md" alt="John Doe" />
          <p className="text-sm text-gray-600">md</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="lg" alt="John Doe" />
          <p className="text-sm text-gray-600">lg</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="xl" alt="John Doe" />
          <p className="text-sm text-gray-600">xl</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Shapes & Content</h3>
      <div className="inline-grid" style={{ gridTemplateColumns: 'auto repeat(3, 1fr)', gap: '1.5rem' }}>
        {/* Header row */}
        <div></div>
        <div className="text-center text-sm font-medium text-gray-600">Circle</div>
        <div className="text-center text-sm font-medium text-gray-600">Rounded</div>
        <div className="text-center text-sm font-medium text-gray-600">Square</div>

        {/* With Images row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">With Images</div>
        <div className="flex justify-center">
          <Avatar
            size="lg"
            shape="circle"
            alt="User Avatar"
            src="https://picsum.photos/id/64/200/200"
          />
        </div>
        <div className="flex justify-center">
          <Avatar
            size="lg"
            shape="rounded"
            alt="User Avatar"
            src="https://picsum.photos/id/64/200/200"
          />
        </div>
        <div className="flex justify-center">
          <Avatar
            size="lg"
            shape="square"
            alt="User Avatar"
            src="https://picsum.photos/id/64/200/200"
          />
        </div>

        {/* Fallback Initials row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Fallback Initials</div>
        <div className="flex justify-center">
          <Avatar size="lg" shape="circle" alt="John Doe" />
        </div>
        <div className="flex justify-center">
          <Avatar size="lg" shape="rounded" alt="John Doe" />
        </div>
        <div className="flex justify-center">
          <Avatar size="lg" shape="square" alt="John Doe" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Article Author</h3>
      <div className="flex items-center gap-3">
        <Avatar
          size="md"
          alt="Shri Mataji Nirmala Devi"
          src="https://picsum.photos/id/64/200/200"
        />
        <div>
          <p className="font-medium text-gray-900">Shri Mataji Nirmala Devi</p>
          <p className="text-sm text-gray-600">Founder of Sahaja Yoga</p>
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Avatar"
