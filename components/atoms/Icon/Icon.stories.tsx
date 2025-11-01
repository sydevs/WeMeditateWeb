import type { Story } from "@ladle/react";
import { Icon } from "./Icon";

/**
 * Icon component showcasing sizes and colors.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Icon name="heart" size="sm" />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="heart" size="md" />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="heart" size="lg" />
          <p className="text-sm text-gray-600">Large</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="heart" size="xl" />
          <p className="text-sm text-gray-600">Extra Large</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Colors</h3>
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Icon name="star" size="lg" color="primary" />
          <p className="text-sm text-gray-600">Primary</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="star" size="lg" color="teal" />
          <p className="text-sm text-gray-600">Teal</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="star" size="lg" color="coral" />
          <p className="text-sm text-gray-600">Coral</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="star" size="lg" color="gray" />
          <p className="text-sm text-gray-600">Gray</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Common Icons</h3>
      <div className="grid grid-cols-6 gap-6">
        <div className="flex flex-col items-center gap-2">
          <Icon name="search" size="lg" />
          <p className="text-xs text-gray-600">search</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="menu" size="lg" />
          <p className="text-xs text-gray-600">menu</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="close" size="lg" />
          <p className="text-xs text-gray-600">close</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="heart" size="lg" />
          <p className="text-xs text-gray-600">heart</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="star" size="lg" />
          <p className="text-xs text-gray-600">star</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="play" size="lg" />
          <p className="text-xs text-gray-600">play</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="pause" size="lg" />
          <p className="text-xs text-gray-600">pause</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="chevron-left" size="lg" />
          <p className="text-xs text-gray-600">chevron-left</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="chevron-right" size="lg" />
          <p className="text-xs text-gray-600">chevron-right</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="check" size="lg" />
          <p className="text-xs text-gray-600">check</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="info" size="lg" />
          <p className="text-xs text-gray-600">info</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="clock" size="lg" />
          <p className="text-xs text-gray-600">clock</p>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Icon in context within UI elements.
 */
export const InContext: Story = () => (
  <div className="flex flex-col gap-8 max-w-2xl">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Button with Icons</h3>
      <div className="flex flex-wrap gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600">
          <Icon name="play" size="sm" color="inherit" />
          <span>Play</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
          <Icon name="heart" size="sm" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
          <span>Next</span>
          <Icon name="chevron-right" size="sm" />
        </button>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">List Items with Icons</h3>
      <ul className="space-y-3">
        <li className="flex items-center gap-3">
          <Icon name="check" size="md" color="teal" />
          <span className="text-gray-700">Reduce stress and anxiety</span>
        </li>
        <li className="flex items-center gap-3">
          <Icon name="check" size="md" color="teal" />
          <span className="text-gray-700">Improve focus and concentration</span>
        </li>
        <li className="flex items-center gap-3">
          <Icon name="check" size="md" color="teal" />
          <span className="text-gray-700">Enhance emotional well-being</span>
        </li>
        <li className="flex items-center gap-3">
          <Icon name="check" size="md" color="teal" />
          <span className="text-gray-700">Better sleep quality</span>
        </li>
      </ul>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Information Cards</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-teal-200 bg-teal-50 rounded-lg p-4 flex gap-3">
          <Icon name="info" size="lg" color="teal" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Beginner Friendly</h4>
            <p className="text-sm text-gray-700">Perfect for those new to meditation</p>
          </div>
        </div>
        <div className="border border-coral-200 bg-coral-50 rounded-lg p-4 flex gap-3">
          <Icon name="clock" size="lg" color="coral" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Quick Session</h4>
            <p className="text-sm text-gray-700">Just 10 minutes a day</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
