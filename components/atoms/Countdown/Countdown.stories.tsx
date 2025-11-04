import type { Story, StoryDefault } from "@ladle/react";
import { Countdown } from "./Countdown";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * Countdown component showcasing various timing durations and sizes.
 */
export const Default: Story = () => {
  // Helper function to create countdown targets
  const createTarget = (seconds: number) => new Date(Date.now() + seconds * 1000);

  return (
    <StoryWrapper>
      <StorySection title="Sizes">
        <div className="flex flex-col gap-12 bg-gray-100 p-8 rounded-lg">
          {/* Small */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">Small</p>
            <Countdown targetDate={createTarget(3600)} size="sm" />
          </div>

          {/* Medium */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">Medium</p>
            <Countdown targetDate={createTarget(3600)} size="md" />
          </div>

          {/* Large */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">Large (default)</p>
            <Countdown targetDate={createTarget(3600)} size="lg" />
          </div>
        </div>
      </StorySection>

      <StorySection title="Various Timings">
        <div className="flex flex-col gap-12 bg-gray-100 p-8 rounded-lg">
          {/* 10 seconds */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">10 seconds</p>
            <Countdown targetDate={createTarget(10)} />
          </div>

          {/* 1 minute */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">1 minute</p>
            <Countdown targetDate={createTarget(60)} />
          </div>

          {/* 10 minutes */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">10 minutes</p>
            <Countdown targetDate={createTarget(600)} />
          </div>

          {/* 1 hour */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">1 hour</p>
            <Countdown targetDate={createTarget(3600)} />
          </div>

          {/* 10 hours */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">10 hours</p>
            <Countdown targetDate={createTarget(36000)} />
          </div>

          {/* 24 hours */}
          <div>
            <p className="text-gray-900 text-sm mb-4 text-center">24 hours</p>
            <Countdown targetDate={createTarget(86400)} />
          </div>
        </div>
      </StorySection>

      <StorySection
        title="Dark Theme"
        theme="dark"
        background="neutral"
        description="White text for dark backgrounds"
      >
        <div className="text-center">
          <Countdown targetDate={createTarget(3600)} theme="dark" />
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  );
};

Default.storyName = "Countdown"
