import type { Story, StoryDefault } from "@ladle/react";
import { Label } from "./Label";
import { Input } from "../Input/Input";
import { StorySection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Label component showcasing basic and required variants.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
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
    </StorySection>
  </StoryWrapper>
);

Default.storyName = "Label"
