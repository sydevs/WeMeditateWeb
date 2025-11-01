import type { Story } from "@ladle/react";
import { Avatar } from "./Avatar";

/**
 * Avatar component showcasing sizes and shapes.
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Shapes</h3>
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar size="lg" alt="John Doe" shape="circle" />
          <p className="text-sm text-gray-600">Circle</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="lg" alt="John Doe" shape="rounded" />
          <p className="text-sm text-gray-600">Rounded</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="lg" alt="John Doe" shape="square" />
          <p className="text-sm text-gray-600">Square</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Images</h3>
      <div className="flex gap-4 items-center">
        <Avatar
          size="lg"
          alt="Shri Mataji"
          src="https://placehold.co/100x100/61aaa0/white?text=SM"
        />
        <Avatar
          size="lg"
          alt="Guest Author"
          src="https://placehold.co/100x100/e08e79/white?text=GA"
        />
        <Avatar
          size="lg"
          alt="Team Member"
          src="https://placehold.co/100x100/4a5568/white?text=TM"
        />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Fallback Initials</h3>
      <div className="flex gap-4 items-center">
        <Avatar size="md" alt="John Doe" />
        <Avatar size="md" alt="Sarah Smith" />
        <Avatar size="md" alt="Michael Chen" />
        <Avatar size="md" alt="Priya Patel" />
        <Avatar size="md" alt="A" />
      </div>
    </div>
  </div>
);

/**
 * Avatar in context with author attribution and user profiles.
 */
export const InContext: Story = () => (
  <div className="flex flex-col gap-8 max-w-2xl">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Article Author</h3>
      <div className="flex items-center gap-3">
        <Avatar
          size="md"
          alt="Shri Mataji Nirmala Devi"
          src="https://placehold.co/100x100/61aaa0/white?text=SM"
        />
        <div>
          <p className="font-medium text-gray-900">Shri Mataji Nirmala Devi</p>
          <p className="text-sm text-gray-600">Founder of Sahaja Yoga</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Comment Thread</h3>
      <div className="space-y-4">
        {[
          { name: "John Doe", comment: "This meditation really helped me find peace." },
          { name: "Sarah Smith", comment: "I practice this every morning now!" },
          { name: "Michael Chen", comment: "Thank you for sharing this technique." },
        ].map((item) => (
          <div key={item.name} className="flex gap-3">
            <Avatar size="sm" alt={item.name} />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-700 mt-1">{item.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">User Profile Card</h3>
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Avatar
            size="xl"
            alt="Priya Patel"
            src="https://placehold.co/150x150/e08e79/white?text=PP"
          />
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">Priya Patel</h4>
            <p className="text-gray-600 mb-3">Meditation practitioner for 5 years</p>
            <p className="text-sm text-gray-700">
              Passionate about sharing the benefits of meditation with others.
              Regular contributor to our meditation community.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
