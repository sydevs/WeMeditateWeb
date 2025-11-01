import type { Story } from "@ladle/react";
import { Spinner } from "./Spinner";

/**
 * Spinner component showcasing sizes and colors.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="sm" />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="md" />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-gray-600">Large</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Colors</h3>
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner color="primary" />
          <p className="text-sm text-gray-600">Primary</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner color="teal" />
          <p className="text-sm text-gray-600">Teal</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner color="coral" />
          <p className="text-sm text-gray-600">Coral</p>
        </div>
        <div className="bg-gray-900 p-4 rounded flex flex-col items-center gap-2">
          <Spinner color="white" />
          <p className="text-sm text-white">White</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Size × Color Combinations</h3>
      <div className="flex gap-8 items-center">
        <Spinner size="sm" color="teal" />
        <Spinner size="md" color="coral" />
        <Spinner size="lg" color="primary" />
      </div>
    </div>
  </div>
);

/**
 * Spinner in context with loading states.
 */
export const InContext: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Loading Content</h3>
      <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Spinner size="lg" />
        <p className="text-gray-600">Loading meditation...</p>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Inline with Text</h3>
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <p className="text-gray-700">Processing your request...</p>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Full-Page Loading</h3>
      <div className="bg-white border border-gray-200 rounded-lg p-12 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="teal" />
          <p className="text-lg text-gray-700">Loading your meditation session</p>
          <p className="text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    </div>
  </div>
);
