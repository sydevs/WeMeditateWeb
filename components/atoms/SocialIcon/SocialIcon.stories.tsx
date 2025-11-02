import type { Story, StoryDefault } from "@ladle/react";
import { SocialIcon } from "./SocialIcon";
import {
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
  StoryWrapper,
  StoryExampleSection
} from '../../ladle';

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * SocialIcon component showcasing all platforms, variants, sizes, and usage in context.
 */
export const Default: Story = () => {
  const platforms = ['facebook', 'instagram', 'bluesky', 'youtube', 'linkedin', 'whatsapp', 'pinterest', 'yandex', 'telegram', 'wechat'] as const
  const colors = ['gray', 'brand', 'primary', 'secondary'] as const

  return (
  <StoryWrapper>
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
          {platforms.map(platform => (
            <StoryGridRow key={platform}>
              <StoryGridCell isLabel>
                <span className="capitalize">{platform}</span>
              </StoryGridCell>
              {colors.map(color => (
                <StoryGridCell key={color}>
                  <SocialIcon platform={platform} color={color} aria-label={`${platform} ${color}`} />
                </StoryGridCell>
              ))}
            </StoryGridRow>
          ))}
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="facebook" size="sm" aria-label="Facebook (small)" />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="facebook" size="md" aria-label="Facebook (medium)" />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="facebook" size="lg" aria-label="Facebook (large)" />
          <p className="text-sm text-gray-600">Large</p>
        </div>
      </div>
    </StorySection>

    <StoryExampleSection>
      <div>
        <p className="font-medium text-gray-900 mb-3">Share this meditation</p>
        <div className="flex gap-3">
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="facebook" color="brand" size="lg" aria-label="Share on Facebook" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="bluesky" color="brand" size="lg" aria-label="Share on BlueSky" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="whatsapp" color="brand" size="lg" aria-label="Share on WhatsApp" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="pinterest" color="brand" size="lg" aria-label="Pin on Pinterest" />
          </button>
        </div>
      </div>
    </StoryExampleSection>
  </StoryWrapper>
  )
};
Default.storyName = "Social Icon"
