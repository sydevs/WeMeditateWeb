import type { Story, StoryDefault } from "@ladle/react";
import { useState } from "react";
import { SplashLoader } from "./SplashLoader";
import { StoryWrapper, StorySection } from '../../ladle';
import { Button } from '../Button';

export default {
  title: "Atoms / Feedback"
} satisfies StoryDefault;

/**
 * SplashLoader component showcasing sizes, color variants, with/without background images,
 * text support, and loading state transitions.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Small</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader size="sm" color="primary" text="Loading..." />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Medium (Default)</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader size="md" color="primary" text="Loading..." />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Large</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader size="lg" color="primary" text="Loading..." />
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="Colors">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Primary (Teal)</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader color="primary" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Secondary (Coral)</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader color="secondary" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Neutral (Gray)</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader color="neutral" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">None (Transparent)</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden bg-linear-to-br from-teal-100 to-coral-100">
            <SplashLoader color="none" />
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="With Background Images">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Primary + Image</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader
              color="primary"
              backgroundImage="https://picsum.photos/seed/splash3/800/600"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Secondary + Image</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader
              color="secondary"
              backgroundImage="https://picsum.photos/seed/splash2/800/600"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Neutral + Image</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader
              color="neutral"
              backgroundImage="https://picsum.photos/seed/splash3/800/600"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">None + Image</p>
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader
              color="none"
              backgroundImage="https://picsum.photos/seed/splash4/800/600"
            />
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="Interactive - Loading State" description="Click the button to toggle loading state and see the fade-out transition">
      <InteractiveSplashLoader />
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Full Page Splash (Large)</p>
          <div className="relative h-96 border border-gray-200 rounded-lg overflow-hidden">
            <SplashLoader
              size="lg"
              color="primary"
              backgroundImage="https://picsum.photos/seed/hero1/1920/1080"
              text="Preparing your meditation journey..."
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Card Loading State (Small)</p>
          <div className="max-w-md">
            <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48">
                <img
                  src="https://picsum.photos/seed/card1/400/300"
                  alt="Card content"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Card Title</h3>
                <p className="text-gray-600">Card content that would load...</p>
              </div>
              <SplashLoader size="sm" color="secondary" text="Loading content..." />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Video Player Loading (Medium)</p>
          <div className="relative aspect-video max-w-2xl bg-black rounded-lg overflow-hidden">
            <SplashLoader
              size="md"
              color="neutral"
              backgroundImage="https://picsum.photos/seed/video1/1280/720"
              text="Buffering video..."
            />
          </div>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Splash Loader"

/**
 * Interactive component to demonstrate loading state transitions
 */
function InteractiveSplashLoader() {
  const [isLoading, setIsLoading] = useState(true);

  const handleToggle = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleToggle}>
          {isLoading ? 'Complete Loading' : 'Start Loading'}
        </Button>
        <span className="text-sm text-gray-600 flex items-center">
          Status: {isLoading ? 'Loading...' : 'Complete'}
        </span>
      </div>

      <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden bg-linear-to-br from-teal-50 to-coral-50">
        <SplashLoader
          color="primary"
          backgroundImage="https://picsum.photos/seed/interactive/800/600"
          text="Please wait, loading your content..."
          isLoading={isLoading}
        />
        {!isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Content Loaded!</h3>
              <p className="text-gray-600">The splash screen has faded out.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
