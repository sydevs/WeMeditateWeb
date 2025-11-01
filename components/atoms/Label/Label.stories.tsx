import type { Story, StoryDefault } from "@ladle/react";
import { Label } from "./Label";
import { Input } from "../Input/Input";

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Label component showcasing all variants including required indicator and helper text.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Labels</h3>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Your Name</Label>
          <Input id="name" type="text" placeholder="Enter your name" />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Required Fields</h3>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="required-name" required>Full Name</Label>
          <Input id="required-name" type="text" placeholder="Enter your full name" />
        </div>
        <div>
          <Label htmlFor="required-email" required>Email Address</Label>
          <Input id="required-email" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="optional-phone">Phone Number (optional)</Label>
          <Input id="optional-phone" type="tel" placeholder="+1 (555) 000-0000" />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Helper Text</h3>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="username" required>Username</Label>
          <Input id="username" type="text" placeholder="Choose a username" />
          <p className="text-sm text-gray-600 mt-1">Must be 3-20 characters</p>
        </div>
        <div>
          <Label htmlFor="password" required>Password</Label>
          <Input id="password" type="password" placeholder="Enter a strong password" />
          <p className="text-sm text-gray-600 mt-1">Minimum 8 characters with letters and numbers</p>
        </div>
      </div>
    </div>
  </div>
);

Default.storyName = "Label"
