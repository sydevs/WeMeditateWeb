import type { Story, StoryDefault } from "@ladle/react";
import { LogoSvg } from './LogoSvg'
import { LeafSvg } from './LeafSvg'
import { LotusDotsSvg } from './LotusDotsSvg'
import { FloralDividerSvg } from './FloralDividerSvg'
import { HeaderIllustrationSvg } from './HeaderIllustrationSvg'
import { TriangleDecorationSvg } from './TriangleDecorationSvg'
import { AnimatedLogoSvg } from './AnimatedLogoSvg'
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

        <div className="flex items-center gap-4">
          <LotusDotsSvg className="w-11 h-11 text-gray-700" />
          <div>
            <p className="font-medium text-gray-700">LotusDotsSvg</p>
            <p className="text-sm text-gray-600">Lotus flower with dots pattern (default: w-11 h-11)</p>
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection title="Animated Icons" description="Animated SVG graphics with looping animations">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <AnimatedLogoSvg className="w-12 h-12 text-teal-600" />
          <div>
            <p className="font-medium text-gray-700">AnimatedLogoSvg</p>
            <p className="text-sm text-gray-600">Animated WeMeditate logo with drawing effect (default: w-12 h-12)</p>
            <p className="text-xs text-teal-600 mt-1">Used for loading states and preloaders</p>
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

        <div className="flex flex-col gap-2">
          <TriangleDecorationSvg className="w-80 h-auto" />
          <div>
            <p className="font-medium text-gray-700">TriangleDecorationSvg</p>
            <p className="text-sm text-gray-600">Geometric triangle decoration with built-in coral and teal colors (default: w-80 h-auto)</p>
            <p className="text-xs text-coral-500 mt-1">Note: Colors are fixed and cannot be changed via currentColor</p>
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
          <LotusDotsSvg className="w-11 h-11 text-teal-600" />
          <LotusDotsSvg className="w-11 h-11 text-coral-500" />
          <LotusDotsSvg className="w-11 h-11 text-gray-700" />
          <LotusDotsSvg className="w-11 h-11 text-gray-400" />
          <span className="text-sm text-gray-600">LotusDotsSvg in different colors</span>
        </div>

        <div className="flex items-center gap-4">
          <AnimatedLogoSvg className="w-12 h-12 text-teal-600" />
          <AnimatedLogoSvg className="w-12 h-12 text-coral-500" />
          <AnimatedLogoSvg className="w-12 h-12 text-gray-700" />
          <AnimatedLogoSvg className="w-12 h-12 text-white" style={{ backgroundColor: '#333' }} />
          <span className="text-sm text-gray-600">AnimatedLogoSvg in different colors</span>
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
          <LeafSvg className="w-6 h-6 text-gray-700" />
          <LeafSvg className="w-[29px] h-8 text-gray-700" />
          <LeafSvg className="w-12 h-12 text-gray-700" />
          <LeafSvg className="w-16 h-16 text-gray-700" />
          <span className="text-sm text-gray-600">LeafSvg (w-6, default, w-12, w-16)</span>
        </div>

        <div className="flex items-center gap-4">
          <LotusDotsSvg className="w-8 h-8 text-gray-700" />
          <LotusDotsSvg className="w-11 h-11 text-gray-700" />
          <LotusDotsSvg className="w-16 h-16 text-gray-700" />
          <LotusDotsSvg className="w-24 h-24 text-gray-700" />
          <span className="text-sm text-gray-600">LotusDotsSvg (w-8, default, w-16, w-24)</span>
        </div>

        <div className="flex items-center gap-4">
          <AnimatedLogoSvg className="w-8 h-8 text-gray-700" />
          <AnimatedLogoSvg className="w-12 h-12 text-gray-700" />
          <AnimatedLogoSvg className="w-16 h-16 text-gray-700" />
          <AnimatedLogoSvg className="w-24 h-24 text-gray-700" />
          <span className="text-sm text-gray-600">AnimatedLogoSvg (w-8, default, w-16, w-24)</span>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "SVG Components"
