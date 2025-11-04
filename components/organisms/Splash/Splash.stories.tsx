import type { Story, StoryDefault } from "@ladle/react";
import { Splash } from "./Splash";
import { Header } from "../Header";
import { Countdown, Button } from "../../atoms";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * Splash component - Full-screen hero section with background image, centered content,
 * and decorative leaf ornaments around the call-to-action.
 */
export const Default: Story = () => {
  // Create a countdown target 24 hours from now
  const tomorrow = new Date()
  tomorrow.setHours(tomorrow.getHours() + 24)

  return (
    <StoryWrapper>
      {/* Basic Splash */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 px-4">Basic Splash</h2>
        <Splash
          backgroundImage="https://picsum.photos/id/1018/1920/1080"
          heading="Meditate for Better Mental Health"
          subtitle="Making a start is easier than you think."
          ctaText="Try it now"
          ctaHref="/start"
          theme="dark"
          pulsate
        />
      </div>

      {/* Splash with Header Overlay (Dark Theme) */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 px-4">With Header Overlay (Dark Theme)</h2>
        <div className="relative">
          <Splash
            backgroundImage="https://picsum.photos/id/1018/1920/1080"
            heading="Meditate for Better Mental Health"
            subtitle="Making a start is easier than you think."
            ctaText="Try it now"
            ctaHref="/start"
            theme="dark"
            pulsate
          />
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <Header
              logoHref="/"
              actionLinkText="Classes near me"
              actionLinkHref="/classes"
              navItems={[
                { label: "Meditate Now", href: "/meditate" },
                { label: "Music for Meditation", href: "/music" },
                { label: "Inspiration", href: "/inspiration" },
                { label: "About Meditation", href: "/about" }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Splash with Header Overlay (Light Theme Background) */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 px-4">With Header Overlay (Light Theme Background)</h2>
        <div className="relative">
          <Splash
            backgroundImage="https://picsum.photos/id/1015/1920/1080"
            heading="Discover Inner Peace"
            subtitle="Your journey to mindfulness starts here."
            ctaText="Begin now"
            ctaHref="/start"
            theme="light"
            pulsate
          />
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <Header
              logoHref="/"
              actionLinkText="Classes near me"
              actionLinkHref="/classes"
              navItems={[
                { label: "Meditate Now", href: "/meditate" },
                { label: "Music for Meditation", href: "/music" },
                { label: "Inspiration", href: "/inspiration" },
                { label: "About Meditation", href: "/about" }
              ]}
            />
          </div>
        </div>
      </div>

      <StorySection title="Countdown Timer" inContext={true}>
        <div className="relative">
          <Splash
            backgroundImage="https://picsum.photos/id/1015/1920/1080"
            heading="Join Free Zoom Meditations!"
            subtitle="Every Tuesday and Thursday at 7 pm London / 8 pm CET"
            ctaText="Sign up"
            ctaHref="/live"
            theme="dark"
            pulsate
          >
            <Countdown targetDate={tomorrow} theme="dark" />
          </Splash>
        </div>
      </StorySection>

      <StorySection title="App Download Buttons" inContext={true}>
        <div className="relative">
          <Splash
            backgroundImage="https://picsum.photos/id/1018/1920/1080"
            heading="Download Our App"
            subtitle="Meditate anytime, anywhere."
            ctaText="Learn more"
            ctaHref="/app"
            theme="dark"
            pulsate
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                href="https://apps.apple.com"
                variant="primary"
                size="lg"
              >
                Download for iOS
              </Button>
              <Button
                href="https://play.google.com"
                variant="secondary"
                size="lg"
              >
                Download for Android
              </Button>
            </div>
          </Splash>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  );
};

Default.storyName = "Splash"
