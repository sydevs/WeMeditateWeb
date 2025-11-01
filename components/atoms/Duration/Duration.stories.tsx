import type { Story, StoryDefault } from "@ladle/react";
import { Duration } from "./Duration";
import { StorySection, StorySubsection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * Duration component showcasing all time values, formats, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Examples">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Common Durations">
          <div className="flex flex-wrap gap-4">
            <Duration minutes={5} />
            <Duration minutes={10} />
            <Duration minutes={15} />
            <Duration minutes={20} />
            <Duration minutes={30} />
            <Duration minutes={45} />
            <Duration minutes={60} />
            <Duration minutes={90} />
            <Duration minutes={120} />
            <Duration minutes={150} />
          </div>
        </StorySubsection>

        <StorySubsection label="Format Variants">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-32">Default (short):</span>
              <Duration minutes={10} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-32">Long format:</span>
              <Duration minutes={10} format="long" />
            </div>
          </div>
        </StorySubsection>

        <StorySubsection label="Meditation Cards">
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">Morning Meditation</h4>
              <p className="text-sm text-gray-600 mb-3">Start your day with clarity and peace</p>
              <Duration minutes={10} />
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">Deep Relaxation</h4>
              <p className="text-sm text-gray-600 mb-3">Release tension and find inner calm</p>
              <Duration minutes={20} />
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">Chakra Meditation</h4>
              <p className="text-sm text-gray-600 mb-3">Balance your energy centers</p>
              <Duration minutes={30} />
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">Extended Practice</h4>
              <p className="text-sm text-gray-600 mb-3">Deep dive into meditation</p>
              <Duration minutes={60} />
            </div>
          </div>
        </StorySubsection>

        <StorySubsection label="Track List">
          <div className="space-y-2 max-w-md">
            {[
              { title: "Peaceful Piano", duration: 5 },
              { title: "Nature Sounds", duration: 10 },
              { title: "Tibetan Bowls", duration: 15 },
              { title: "Ambient Meditation", duration: 30 },
            ].map((track) => (
              <div key={track.title} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                <span className="text-gray-900">{track.title}</span>
                <Duration minutes={track.duration} />
              </div>
            ))}
          </div>
        </StorySubsection>
      </div>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
Default.storyName = "Duration"
