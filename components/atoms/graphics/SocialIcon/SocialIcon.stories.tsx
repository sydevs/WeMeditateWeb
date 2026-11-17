import type { Story, StoryDefault } from '@ladle/react'
import { SocialIcon } from './SocialIcon'
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
} from '../../../ladle'

export default {
  title: 'Atoms / Graphics',
} satisfies StoryDefault

/** SocialIcon component showcasing all platforms, variants, sizes, and usage in context. */
export const Default: Story = () => {
  const platforms = [
    'facebook',
    'instagram',
    'bluesky',
    'youtube',
    'linkedin',
    'whatsapp',
    'pinterest',
    'yandex',
    'telegram',
    'wechat',
  ] as const
  const colors = ['gray', 'brand', 'primary', 'secondary'] as const

  return (
    <StoryWrapper>
      <StorySection title="Colors">
        <StoryGrid>
          <StoryGridHeader>
            <StoryGridHeaderRow>
              <StoryGridHeaderCell />
              {colors.map((color) => (
                <StoryGridHeaderCell key={color}>
                  <span className="capitalize">{color}</span>
                </StoryGridHeaderCell>
              ))}
            </StoryGridHeaderRow>
          </StoryGridHeader>
          <StoryGridBody>
            {platforms.map((platform) => (
              <StoryGridRow key={platform}>
                <StoryGridCell isLabel>
                  <span className="capitalize">{platform}</span>
                </StoryGridCell>
                {colors.map((color) => (
                  <StoryGridCell key={color}>
                    <SocialIcon
                      aria-label={`${platform} ${color}`}
                      color={color}
                      platform={platform}
                    />
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
            <SocialIcon aria-label="Facebook (small)" platform="facebook" size="sm" />
            <p className="text-sm text-gray-700">Small</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <SocialIcon aria-label="Facebook (medium)" platform="facebook" size="md" />
            <p className="text-sm text-gray-700">Medium</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <SocialIcon aria-label="Facebook (large)" platform="facebook" size="lg" />
            <p className="text-sm text-gray-700">Large</p>
          </div>
        </div>
      </StorySection>

      <>
        <div>
          <p className="font-medium text-gray-900 mb-3">Share this meditation</p>
          <div className="flex gap-3">
            <button className="hover:scale-110 transition-transform">
              <SocialIcon
                aria-label="Share on Facebook"
                color="brand"
                platform="facebook"
                size="lg"
              />
            </button>
            <button className="hover:scale-110 transition-transform">
              <SocialIcon
                aria-label="Share on BlueSky"
                color="brand"
                platform="bluesky"
                size="lg"
              />
            </button>
            <button className="hover:scale-110 transition-transform">
              <SocialIcon
                aria-label="Share on WhatsApp"
                color="brand"
                platform="whatsapp"
                size="lg"
              />
            </button>
            <button className="hover:scale-110 transition-transform">
              <SocialIcon
                aria-label="Pin on Pinterest"
                color="brand"
                platform="pinterest"
                size="lg"
              />
            </button>
          </div>
        </div>
      </>
    </StoryWrapper>
  )
}
Default.storyName = 'Social Icon'
