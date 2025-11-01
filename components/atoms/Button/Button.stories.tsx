import type { Story } from "@ladle/react";
import { Button } from "./Button";

/**
 * Button component showcasing all variants and sizes.
 * Buttons are used for user actions and come in multiple visual styles.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="text">Text</Button>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variant × Size Combinations</h3>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-3">Primary</p>
          <div className="flex gap-3 items-center">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-3">Secondary</p>
          <div className="flex gap-3 items-center">
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="secondary" size="md">Medium</Button>
            <Button variant="secondary" size="lg">Large</Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-3">Outline</p>
          <div className="flex gap-3 items-center">
            <Button variant="outline" size="sm">Small</Button>
            <Button variant="outline" size="md">Medium</Button>
            <Button variant="outline" size="lg">Large</Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-3">Text</p>
          <div className="flex gap-3 items-center">
            <Button variant="text" size="sm">Small</Button>
            <Button variant="text" size="md">Medium</Button>
            <Button variant="text" size="lg">Large</Button>
          </div>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Full Width</h3>
      <div className="max-w-md space-y-3">
        <Button variant="primary" fullWidth>Full Width Primary</Button>
        <Button variant="secondary" fullWidth>Full Width Secondary</Button>
        <Button variant="outline" fullWidth>Full Width Outline</Button>
      </div>
    </div>
  </div>
);

/**
 * Button states including loading and disabled variants.
 */
export const States: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Loading State</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary" isLoading>Loading</Button>
        <Button variant="secondary" isLoading>Loading</Button>
        <Button variant="outline" isLoading>Loading</Button>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Disabled State</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="secondary" disabled>Disabled</Button>
        <Button variant="outline" disabled>Disabled</Button>
        <Button variant="text" disabled>Disabled</Button>
      </div>
    </div>
  </div>
);
