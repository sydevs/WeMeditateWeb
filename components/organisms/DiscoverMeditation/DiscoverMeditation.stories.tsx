import type { Story, StoryDefault } from "@ladle/react";
import { DiscoverMeditation } from "./DiscoverMeditation";

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * DiscoverMeditation is a component: a full-height call-to-action section
 * that encourages users to discover meditation, through online meditation
 * or local classes.
 */
export const Default: Story = () => (
  <>
    <DiscoverMeditation />
    <div className="h-32" />
  </>
);

Default.storyName = "Discover Meditation"
