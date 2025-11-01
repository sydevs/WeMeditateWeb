import type { Story, StoryDefault } from "@ladle/react";
import { Label } from "./Label";
import { Input } from "../Input/Input";

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Label component showcasing basic and required variants.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Examples</h3>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Your Name</Label>
          <Input id="name" type="text" placeholder="Enter your name" />
        </div>
        <div>
          <Label htmlFor="email" required>Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
      </div>
    </div>
  </div>
);

Default.storyName = "Label"
