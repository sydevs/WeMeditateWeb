import type { Story, StoryDefault } from "@ladle/react";
import { SocialShare } from "./SocialShare";
import {
  StoryWrapper,
  StorySection,
  StorySubsection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
  StoryExampleSection
} from '../../ladle';

export default {
  title: "Molecules / Social"
} satisfies StoryDefault;

/**
 * SocialShare component for sharing content on social media platforms.
 * Displays a label with social media icons that open share dialogs.
 */
export const Default: Story = () => {
  const exampleUrl = "https://wemeditate.com/classes"
  const colors = ['gray', 'primary', 'secondary', 'brand'] as const
  const sizes = ['sm', 'md', 'lg', 'xl'] as const

  return (
    <StoryWrapper>
      <StorySection title="Basic Examples">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Default (no label, Facebook, Pinterest, LinkedIn, Bluesky)</p>
            <SocialShare url={exampleUrl} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">With title for sharing</p>
            <SocialShare url={exampleUrl} title="Free Meditation Classes" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">With label</p>
            <SocialShare url={exampleUrl} label="Share:" />
          </div>
        </div>
      </StorySection>

      <StorySection title="Platform Combinations">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Default platforms</p>
            <SocialShare url={exampleUrl} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">All available platforms</p>
            <SocialShare url={exampleUrl} platforms={['facebook', 'pinterest', 'linkedin', 'bluesky', 'whatsapp', 'telegram']} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Messaging platforms (WhatsApp, Telegram)</p>
            <SocialShare url={exampleUrl} platforms={['whatsapp', 'telegram']} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Social networks (Facebook, Pinterest, LinkedIn, Bluesky)</p>
            <SocialShare url={exampleUrl} platforms={['facebook', 'pinterest', 'linkedin', 'bluesky']} />
          </div>
        </div>
      </StorySection>

      <StorySection title="Colors">
        <StoryGrid>
          <StoryGridHeader>
            <StoryGridHeaderRow>
              <StoryGridHeaderCell />
              {colors.map(color => (
                <StoryGridHeaderCell key={color}>
                  <span className="capitalize">{color}</span>
                </StoryGridHeaderCell>
              ))}
            </StoryGridHeaderRow>
          </StoryGridHeader>
          <StoryGridBody>
            <StoryGridRow>
              <StoryGridCell isLabel>All Platforms</StoryGridCell>
              {colors.map(color => (
                <StoryGridCell key={color}>
                  <SocialShare url={exampleUrl} color={color} />
                </StoryGridCell>
              ))}
            </StoryGridRow>
          </StoryGridBody>
        </StoryGrid>
      </StorySection>

      <StorySection title="Sizes">
        <StoryGrid>
          <StoryGridHeader>
            <StoryGridHeaderRow>
              <StoryGridHeaderCell />
              {sizes.map(size => (
                <StoryGridHeaderCell key={size}>
                  <span className="capitalize">{size}</span>
                </StoryGridHeaderCell>
              ))}
            </StoryGridHeaderRow>
          </StoryGridHeader>
          <StoryGridBody>
            <StoryGridRow>
              <StoryGridCell isLabel>All Platforms</StoryGridCell>
              {sizes.map(size => (
                <StoryGridCell key={size}>
                  <SocialShare url={exampleUrl} size={size} />
                </StoryGridCell>
              ))}
            </StoryGridRow>
          </StoryGridBody>
        </StoryGrid>
      </StorySection>

      <StoryExampleSection>
        <div className="space-y-8">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Page Footer</p>
            <div className="max-w-2xl p-6 bg-gray-50 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Free Meditation Classes Near You
              </h2>
              <p className="text-gray-700 mb-6">
                Join thousands of people who have discovered inner peace through Sahaja Yoga meditation.
                Our classes are completely free and suitable for beginners.
              </p>
              <SocialShare
                url="https://wemeditate.com/classes"
                title="Free Meditation Classes"
                label="Share:"
                color="brand"
                size="lg"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Article Share Bar</p>
            <div className="max-w-4xl border border-gray-200 rounded-lg overflow-hidden">
              <article className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Benefits of Daily Meditation
                </h1>
                <div className="flex items-center justify-between py-4 border-y border-gray-200 mb-6">
                  <p className="text-sm text-gray-500">Published on January 15, 2025</p>
                  <SocialShare
                    url="https://wemeditate.com/articles/benefits-of-meditation"
                    title="Benefits of Daily Meditation"
                    size="md"
                    color="primary"
                  />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Regular meditation practice has been shown to reduce stress, improve focus,
                  and enhance overall well-being. Discover how just 10 minutes a day can transform your life...
                </p>
              </article>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Minimal Style</p>
            <div className="max-w-xl p-6 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Did you find this helpful?
                </h3>
                <SocialShare
                  url={exampleUrl}
                  size="sm"
                  color="gray"
                />
              </div>
            </div>
          </div>
        </div>
      </StoryExampleSection>
    </StoryWrapper>
  )
};
Default.storyName = "Social Share"
