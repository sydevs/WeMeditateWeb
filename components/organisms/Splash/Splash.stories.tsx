import type { Story, StoryDefault } from '@ladle/react'
import { Splash } from './Splash'
import { Header } from '../Header'
import { Countdown, Button, Input } from '../../atoms'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

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
          pulsate
          backgroundImage="https://picsum.photos/id/1018/1920/1080"
          className="full-bleed"
          ctaHref="/start"
          ctaText="Try it now"
          subtitle="Making a start is easier than you think."
          theme="dark"
          title="Meditate for Better Mental Health"
        />
      </div>

      {/* Splash with Header Overlay (Dark Theme) */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 px-4">With Header Overlay (Dark Theme)</h2>
        <div className="relative full-bleed">
          <Splash
            pulsate
            backgroundImage="https://picsum.photos/id/1018/1920/1080"
            ctaHref="/start"
            ctaText="Try it now"
            subtitle="Making a start is easier than you think."
            theme="dark"
            title="Meditate for Better Mental Health"
          />
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <Header
              actionLinkHref="/classes"
              actionLinkText="Classes near me"
              logoHref="/"
              navItems={[
                { label: 'Meditate Now', href: '/meditate' },
                { label: 'Music for Meditation', href: '/music' },
                { label: 'Inspiration', href: '/inspiration' },
                { label: 'About Meditation', href: '/about' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Splash with Header Overlay (Light Theme Background) */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 px-4">
          With Header Overlay (Light Theme Background)
        </h2>
        <div className="relative full-bleed">
          <Splash
            pulsate
            backgroundImage="https://picsum.photos/id/1015/1920/1080"
            ctaHref="/start"
            ctaText="Begin now"
            subtitle="Your journey to mindfulness starts here."
            theme="light"
            title="Discover Inner Peace"
          />
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <Header
              actionLinkHref="/classes"
              actionLinkText="Classes near me"
              logoHref="/"
              navItems={[
                { label: 'Meditate Now', href: '/meditate' },
                { label: 'Music for Meditation', href: '/music' },
                { label: 'Inspiration', href: '/inspiration' },
                { label: 'About Meditation', href: '/about' },
              ]}
            />
          </div>
        </div>
      </div>

      <StorySection inContext={true} title="Countdown Timer">
        <div className="relative full-bleed">
          <Splash
            pulsate
            backgroundImage="https://picsum.photos/id/1015/1920/1080"
            ctaHref="/live"
            ctaText="Sign up"
            subtitle="Every Tuesday and Thursday at 7 pm London / 8 pm CET"
            theme="dark"
            title="Join Free Zoom Meditations!"
          >
            <Countdown targetDate={tomorrow} theme="dark" />
          </Splash>
        </div>
      </StorySection>

      <StorySection inContext={true} title="App Download Buttons">
        <div className="relative full-bleed">
          <Splash
            pulsate
            backgroundImage="https://picsum.photos/id/1018/1920/1080"
            ctaHref="/app"
            ctaText="Learn more"
            subtitle="Meditate anytime, anywhere."
            theme="dark"
            title="Download Our App"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button href="https://apps.apple.com" size="lg" variant="primary">
                Download for iOS
              </Button>
              <Button href="https://play.google.com" size="lg" variant="secondary">
                Download for Android
              </Button>
            </div>
          </Splash>
        </div>
      </StorySection>

      <StorySection inContext={true} title="Search Input with Header Overlay">
        <div className="relative max-h-96 md:max-h-160 overflow-hidden full-bleed">
          <Splash backgroundImage="https://picsum.photos/id/1019/1920/1080" theme="dark">
            <div className="max-w-md mx-auto shadow-md">
              <Input
                className="text-lg py-4 w-full"
                placeholder="Search meditations, articles, music..."
                type="search"
              />
            </div>
          </Splash>
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <Header
              actionLinkHref="/classes"
              actionLinkText="Classes near me"
              logoHref="/"
              navItems={[
                { label: 'Meditate Now', href: '/meditate' },
                { label: 'Music for Meditation', href: '/music' },
                { label: 'Inspiration', href: '/inspiration' },
                { label: 'About Meditation', href: '/about' },
              ]}
              theme="dark"
            />
          </div>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Splash'
