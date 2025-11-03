import type { Story, StoryDefault } from "@ladle/react";
import { LogoSvg } from './LogoSvg'
import { LeafSvg } from './LeafSvg'
import { MeditationSvg } from './MeditationSvg'
import { LocationSvg } from './LocationSvg'
import { FloralDividerSvg } from './FloralDividerSvg'
import { HeaderIllustrationSvg } from './HeaderIllustrationSvg'
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Comprehensive showcase of all SVG icons and illustrations used throughout the application.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Brand Icons" description="Core brand identity SVG icons">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <LogoSvg className="w-5 h-5 text-gray-700" />
          <div>
            <p className="font-medium text-gray-700">LogoSvg</p>
            <p className="text-sm text-gray-600">Lotus flower icon (default: w-5 h-5)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LeafSvg className="w-[29px] h-8 text-gray-700" />
          <div>
            <p className="font-medium text-gray-700">LeafSvg</p>
            <p className="text-sm text-gray-600">Decorative leaf ornament (default: w-[29px] h-8)</p>
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="Illustration Icons" description="Illustrative icons for user actions">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <MeditationSvg className="w-24 h-24 text-gray-700" />
          <div>
            <p className="font-medium text-gray-700">MeditationSvg</p>
            <p className="text-sm text-gray-600">Person in meditation pose (default: w-24 h-24)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LocationSvg className="w-24 h-24 text-gray-700" />
          <div>
            <p className="font-medium text-gray-700">LocationSvg</p>
            <p className="text-sm text-gray-600">Location pin icon (default: w-24 h-24)</p>
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="Decorative Elements" description="Ornamental SVG graphics for visual enhancement">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <FloralDividerSvg className="w-52 h-auto text-gray-500" />
          <div>
            <p className="font-medium text-gray-700">FloralDividerSvg</p>
            <p className="text-sm text-gray-600">Decorative floral divider (default: w-52 h-auto)</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <HeaderIllustrationSvg className="w-full h-auto max-h-24 text-gray-700" />
          <div>
            <p className="font-medium text-gray-700">HeaderIllustrationSvg</p>
            <p className="text-sm text-gray-600">Header banner illustration (default: w-full h-auto max-h-24)</p>
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="Color Variations" description="SVGs inherit text color via currentColor">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <LogoSvg className="w-8 h-8 text-teal-600" />
          <LogoSvg className="w-8 h-8 text-coral-500" />
          <LogoSvg className="w-8 h-8 text-gray-700" />
          <LogoSvg className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600">LogoSvg in different colors</span>
        </div>

        <div className="flex items-center gap-4">
          <LeafSvg className="w-[29px] h-8 text-teal-600" />
          <LeafSvg className="w-[29px] h-8 text-coral-500" />
          <LeafSvg className="w-[29px] h-8 text-gray-700" />
          <LeafSvg className="w-[29px] h-8 text-gray-400" />
          <span className="text-sm text-gray-600">LeafSvg in different colors</span>
        </div>

        <div className="flex items-center gap-4">
          <MeditationSvg className="w-16 h-16 text-teal-600" />
          <MeditationSvg className="w-16 h-16 text-coral-500" />
          <MeditationSvg className="w-16 h-16 text-gray-700" />
          <MeditationSvg className="w-16 h-16 text-gray-400" />
          <span className="text-sm text-gray-600">MeditationSvg in different colors</span>
        </div>

        <div className="flex items-center gap-4">
          <LocationSvg className="w-16 h-16 text-teal-600" />
          <LocationSvg className="w-16 h-16 text-coral-500" />
          <LocationSvg className="w-16 h-16 text-gray-700" />
          <LocationSvg className="w-16 h-16 text-gray-400" />
          <span className="text-sm text-gray-600">LocationSvg in different colors</span>
        </div>
      </div>
    </StorySection>

    <StorySection title="Size Variations" description="Flexible sizing using className prop">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <LogoSvg className="w-4 h-4 text-gray-700" />
          <LogoSvg className="w-5 h-5 text-gray-700" />
          <LogoSvg className="w-7 h-7 text-gray-700" />
          <LogoSvg className="w-10 h-10 text-gray-700" />
          <span className="text-sm text-gray-600">LogoSvg (w-4, w-5, w-7, w-10)</span>
        </div>

        <div className="flex items-center gap-4">
          <MeditationSvg className="w-12 h-12 text-gray-700" />
          <MeditationSvg className="w-16 h-16 text-gray-700" />
          <MeditationSvg className="w-24 h-24 text-gray-700" />
          <MeditationSvg className="w-32 h-32 text-gray-700" />
          <span className="text-sm text-gray-600">MeditationSvg (w-12, w-16, w-24, w-32)</span>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "SVG Components"
