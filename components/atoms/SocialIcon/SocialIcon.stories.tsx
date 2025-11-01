import type { Story, StoryDefault } from "@ladle/react";
import { SocialIcon } from "./SocialIcon";

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * SocialIcon component showcasing all platforms, variants, sizes, and usage in context.
 */
export const Default: Story = () => {
  const platforms = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'whatsapp', 'pinterest'] as const

  return (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Platforms & Colors</h3>
      <div className="inline-grid" style={{ gridTemplateColumns: 'auto repeat(7, 1fr)', gap: '1.5rem' }}>
        {/* Header row */}
        <div></div>
        {platforms.map(platform => (
          <div key={platform} className="text-center text-sm font-medium text-gray-600 capitalize">
            {platform}
          </div>
        ))}

        {/* Gray row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Gray</div>
        {platforms.map(platform => (
          <div key={platform} className="flex justify-center">
            <SocialIcon platform={platform} color="gray" aria-label={platform} />
          </div>
        ))}

        {/* Brand Colors row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Brand Colors</div>
        {platforms.map(platform => (
          <div key={platform} className="flex justify-center">
            <SocialIcon platform={platform} color="brand" aria-label={platform} />
          </div>
        ))}

        {/* Primary row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Primary</div>
        {platforms.map(platform => (
          <div key={platform} className="flex justify-center">
            <SocialIcon platform={platform} color="primary" aria-label={platform} />
          </div>
        ))}

        {/* Secondary row */}
        <div className="text-sm font-medium text-gray-600 flex items-center">Secondary</div>
        {platforms.map(platform => (
          <div key={platform} className="flex justify-center">
            <SocialIcon platform={platform} color="secondary" aria-label={platform} />
          </div>
        ))}
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
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
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context</h3>
      <div>
        <p className="font-medium text-gray-900 mb-3">Share this meditation</p>
        <div className="flex gap-3">
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="facebook" color="brand" size="lg" aria-label="Share on Facebook" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="twitter" color="brand" size="lg" aria-label="Share on Twitter" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="whatsapp" color="brand" size="lg" aria-label="Share on WhatsApp" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="pinterest" color="brand" size="lg" aria-label="Pin on Pinterest" />
          </button>
        </div>
      </div>
    </div>
  </div>
  )
};
Default.storyName = "Social Icon"
