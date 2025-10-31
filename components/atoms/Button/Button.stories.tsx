import type { Story } from "@ladle/react";
import { Button, ButtonProps } from "./Button";

export const Primary: Story<ButtonProps> = () => (
  <Button variant="primary">Primary Button</Button>
);

export const Secondary: Story<ButtonProps> = () => (
  <Button variant="secondary">Secondary Button</Button>
);

export const Outline: Story<ButtonProps> = () => (
  <Button variant="outline">Outline Button</Button>
);

export const TextButton: Story<ButtonProps> = () => (
  <Button variant="text">Text Button</Button>
);

export const Sizes: Story = () => (
  <div className="flex flex-col gap-4 items-start">
    <Button size="sm">Small Button</Button>
    <Button size="md">Medium Button</Button>
    <Button size="lg">Large Button</Button>
  </div>
);

export const Loading: Story<ButtonProps> = () => (
  <div className="flex gap-4">
    <Button variant="primary" isLoading>
      Loading
    </Button>
    <Button variant="secondary" isLoading>
      Loading
    </Button>
    <Button variant="outline" isLoading>
      Loading
    </Button>
  </div>
);

export const FullWidth: Story<ButtonProps> = () => (
  <div className="max-w-md">
    <Button variant="primary" fullWidth>
      Full Width Button
    </Button>
  </div>
);

export const Disabled: Story<ButtonProps> = () => (
  <div className="flex gap-4">
    <Button variant="primary" disabled>
      Disabled Primary
    </Button>
    <Button variant="secondary" disabled>
      Disabled Secondary
    </Button>
    <Button variant="outline" disabled>
      Disabled Outline
    </Button>
  </div>
);

export const AllVariants: Story = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Primary Variant</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Secondary Variant</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="secondary" size="sm">
          Small
        </Button>
        <Button variant="secondary" size="md">
          Medium
        </Button>
        <Button variant="secondary" size="lg">
          Large
        </Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Outline Variant</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="outline" size="sm">
          Small
        </Button>
        <Button variant="outline" size="md">
          Medium
        </Button>
        <Button variant="outline" size="lg">
          Large
        </Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Text Variant</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="text" size="sm">
          Small
        </Button>
        <Button variant="text" size="md">
          Medium
        </Button>
        <Button variant="text" size="lg">
          Large
        </Button>
      </div>
    </div>
  </div>
);
