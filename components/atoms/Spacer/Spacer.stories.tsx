import type { Story, StoryDefault } from "@ladle/react";
import { Spacer } from "./Spacer";
import { StorySection,
  StoryExampleSection, StorySubsection, StoryWrapper } from '../../ladle';

export default {
  title: "Atoms / Layout"
} satisfies StoryDefault;

/**
 * Spacer component showcasing all vertical and horizontal spacing options, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Vertical Spacing">
          <div className="border border-gray-200 rounded p-4">
            <p className="text-gray-700">First element</p>
            <Spacer size="sm" />
            <p className="bg-gray-100 p-2 rounded text-gray-700">After small spacer (0.5rem)</p>

            <p className="text-gray-700 mt-6">Second element</p>
            <Spacer size="md" />
            <p className="bg-gray-100 p-2 rounded text-gray-700">After medium spacer (1rem)</p>

            <p className="text-gray-700 mt-6">Third element</p>
            <Spacer size="lg" />
            <p className="bg-gray-100 p-2 rounded text-gray-700">After large spacer (1.5rem)</p>

            <p className="text-gray-700 mt-6">Fourth element</p>
            <Spacer size="xl" />
            <p className="bg-gray-100 p-2 rounded text-gray-700">After extra large spacer (2rem)</p>
          </div>
        </StorySubsection>

        <StorySubsection label="Horizontal Spacing">
          <div className="border border-gray-200 rounded p-4">
            <div className="flex items-center">
              <p className="text-gray-700">First</p>
              <Spacer direction="horizontal" size="sm" />
              <p className="bg-gray-100 p-2 rounded text-gray-700">SM</p>
              <Spacer direction="horizontal" size="md" />
              <p className="bg-gray-100 p-2 rounded text-gray-700">MD</p>
              <Spacer direction="horizontal" size="lg" />
              <p className="bg-gray-100 p-2 rounded text-gray-700">LG</p>
              <Spacer direction="horizontal" size="xl" />
              <p className="bg-gray-100 p-2 rounded text-gray-700">XL</p>
            </div>
          </div>
        </StorySubsection>

        <StorySubsection label="All Sizes Comparison">
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Small</p>
              <div className="bg-gray-100 p-2 rounded text-xs">Top</div>
              <Spacer size="sm" />
              <div className="bg-gray-100 p-2 rounded text-xs">Bottom</div>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Medium</p>
              <div className="bg-gray-100 p-2 rounded text-xs">Top</div>
              <Spacer size="md" />
              <div className="bg-gray-100 p-2 rounded text-xs">Bottom</div>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Large</p>
              <div className="bg-gray-100 p-2 rounded text-xs">Top</div>
              <Spacer size="lg" />
              <div className="bg-gray-100 p-2 rounded text-xs">Bottom</div>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Extra Large</p>
              <div className="bg-gray-100 p-2 rounded text-xs">Top</div>
              <Spacer size="xl" />
              <div className="bg-gray-100 p-2 rounded text-xs">Bottom</div>
            </div>
          </div>
        </StorySubsection>
      </div>
    </StorySection>

    <StoryExampleSection>
      <div className="flex flex-col gap-8 max-w-2xl">
        <StorySubsection label="Article Layout">
          <article className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900">Guide to Meditation</h2>
            <Spacer size="md" />
            <p className="text-sm text-gray-600">Published on January 15, 2025</p>
            <Spacer size="lg" />
            <p className="text-gray-700">
              Meditation is a practice of focused attention and awareness that has been
              practiced for thousands of years in various cultures around the world.
            </p>
            <Spacer size="md" />
            <p className="text-gray-700">
              Begin with just a few minutes each day in a quiet, comfortable space.
              Consistency is more important than duration when starting out.
            </p>
            <Spacer size="xl" />
            <h3 className="text-xl font-semibold text-gray-900">Getting Started</h3>
            <Spacer size="sm" />
            <p className="text-gray-700">
              Choose a comfortable, quiet location where you won't be disturbed. This
              could be a corner of your bedroom, a peaceful spot in your garden, or
              anywhere you feel at ease.
            </p>
          </article>
        </StorySubsection>

        <StorySubsection label="Card Layout">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Morning Meditation</h3>
              <span className="text-teal-600 font-medium">10 min</span>
            </div>
            <Spacer size="md" />
            <p className="text-gray-700">
              Start your day with clarity and peace through this guided morning meditation.
            </p>
            <Spacer size="lg" />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600">
                Start
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Save for Later
              </button>
            </div>
          </div>
        </StorySubsection>

        <StorySubsection label="Form Layout">
          <form className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900">Create Account</h3>
            <Spacer size="lg" />

            <label className="block text-sm font-medium text-gray-900">Name</label>
            <Spacer size="sm" />
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
              placeholder="Your name"
            />
            <Spacer size="md" />

            <label className="block text-sm font-medium text-gray-900">Email</label>
            <Spacer size="sm" />
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
              placeholder="you@example.com"
            />
            <Spacer size="md" />

            <label className="block text-sm font-medium text-gray-900">Password</label>
            <Spacer size="sm" />
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
              placeholder="••••••••"
            />
            <Spacer size="lg" />

            <button className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600">
              Sign Up
            </button>
          </form>
        </StorySubsection>
      </div>
    </StoryExampleSection>
  </StoryWrapper>
);
Default.storyName = "Spacer"
