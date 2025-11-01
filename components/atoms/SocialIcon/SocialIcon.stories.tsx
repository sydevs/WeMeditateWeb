import type { Story, StoryDefault } from "@ladle/react";
import { SocialIcon } from "./SocialIcon";

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * SocialIcon component showcasing all platforms, variants, sizes, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">All Platforms (Monochrome)</h3>
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="facebook" aria-label="Facebook" />
          <p className="text-sm text-gray-600">Facebook</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="twitter" aria-label="Twitter" />
          <p className="text-sm text-gray-600">Twitter</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="instagram" aria-label="Instagram" />
          <p className="text-sm text-gray-600">Instagram</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="youtube" aria-label="YouTube" />
          <p className="text-sm text-gray-600">YouTube</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="whatsapp" aria-label="WhatsApp" />
          <p className="text-sm text-gray-600">WhatsApp</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="pinterest" aria-label="Pinterest" />
          <p className="text-sm text-gray-600">Pinterest</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">All Platforms (Colored)</h3>
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="facebook" colored aria-label="Facebook" />
          <p className="text-sm text-gray-600">Facebook</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="twitter" colored aria-label="Twitter" />
          <p className="text-sm text-gray-600">Twitter</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="instagram" colored aria-label="Instagram" />
          <p className="text-sm text-gray-600">Instagram</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="youtube" colored aria-label="YouTube" />
          <p className="text-sm text-gray-600">YouTube</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="whatsapp" colored aria-label="WhatsApp" />
          <p className="text-sm text-gray-600">WhatsApp</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SocialIcon platform="pinterest" colored aria-label="Pinterest" />
          <p className="text-sm text-gray-600">Pinterest</p>
        </div>
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Social Links and Share Buttons</h3>
      <div className="flex flex-col gap-8 max-w-2xl">
      <div>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex flex-col items-center gap-4">
          <p className="text-white font-medium">Follow Us</p>
          <div className="flex gap-4">
            <a href="#facebook" className="hover:opacity-75 transition-opacity">
              <SocialIcon platform="facebook" className="text-white" aria-label="Follow us on Facebook" />
            </a>
            <a href="#twitter" className="hover:opacity-75 transition-opacity">
              <SocialIcon platform="twitter" className="text-white" aria-label="Follow us on Twitter" />
            </a>
            <a href="#instagram" className="hover:opacity-75 transition-opacity">
              <SocialIcon platform="instagram" className="text-white" aria-label="Follow us on Instagram" />
            </a>
            <a href="#youtube" className="hover:opacity-75 transition-opacity">
              <SocialIcon platform="youtube" className="text-white" aria-label="Subscribe on YouTube" />
            </a>
          </div>
        </div>
      </div>
      </div>

      <hr className="border-gray-200" />

      <div>
      <div className="border border-gray-200 rounded-lg p-6">
        <p className="font-medium text-gray-900 mb-3">Share this meditation</p>
        <div className="flex gap-3">
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="facebook" colored size="lg" aria-label="Share on Facebook" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="twitter" colored size="lg" aria-label="Share on Twitter" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="whatsapp" colored size="lg" aria-label="Share on WhatsApp" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <SocialIcon platform="pinterest" colored size="lg" aria-label="Pin on Pinterest" />
          </button>
        </div>
      </div>
      </div>

      <hr className="border-gray-200" />

      <div>
      <div className="border border-gray-200 rounded-lg p-4 max-w-xs">
        <h4 className="font-medium text-gray-900 mb-3">Connect With Us</h4>
        <div className="space-y-2">
          <a href="#facebook" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
            <SocialIcon platform="facebook" size="sm" />
            <span className="text-gray-700">Facebook</span>
          </a>
          <a href="#twitter" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
            <SocialIcon platform="twitter" size="sm" />
            <span className="text-gray-700">Twitter</span>
          </a>
          <a href="#instagram" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
            <SocialIcon platform="instagram" size="sm" />
            <span className="text-gray-700">Instagram</span>
          </a>
          <a href="#youtube" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
            <SocialIcon platform="youtube" size="sm" />
            <span className="text-gray-700">YouTube</span>
          </a>
        </div>
      </div>
      </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Social Icon"
