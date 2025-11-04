import type { Story, StoryDefault } from "@ladle/react";
import { StorySection, StoryWrapper } from '../ladle';

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Typography showcase demonstrating text sizing, weights, and colors using Tailwind CSS utilities.
 *
 * This is a documentation-only story showing typography options available in the design system.
 * Use these Tailwind classes directly in your components instead of wrapping text in a component.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      title="Sizes"
      description="Responsive text sizes with mobile-first breakpoints. Base and larger sizes adapt from mobile to desktop."
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs">Extra small text (text-xs)</p>
        <p className="text-sm">Small text (text-sm)</p>
        <p className="text-sm sm:text-base">Base text (text-sm sm:text-base) - responsive default</p>
        <p className="text-base sm:text-lg">Large text (text-base sm:text-lg)</p>
        <p className="text-lg sm:text-xl">Extra large text (text-lg sm:text-xl)</p>
        <p className="text-xl sm:text-2xl">2X large text (text-xl sm:text-2xl)</p>
      </div>
    </StorySection>

    <StorySection
      title="Weights"
      description="Raleway font weights from 200 (extralight) to 700 (bold). Light (300) is the default for body text."
    >
      <div className="flex flex-col gap-3">
        <p className="font-extralight">Extra light weight - font-extralight (200)</p>
        <p className="font-light">Light weight - font-light (300) - default for body text</p>
        <p className="font-normal">Normal weight - font-normal (400)</p>
        <p className="font-medium">Medium weight - font-medium (500) - default for headings</p>
        <p className="font-semibold">Semibold weight - font-semibold (600)</p>
        <p className="font-bold">Bold weight - font-bold (700)</p>
      </div>
    </StorySection>

    <StorySection
      title="Colors"
      description="Semantic text colors from the design system. Use color utilities that match your content's purpose."
    >
      <div className="flex gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-gray-900">Default color - text-gray-900</p>
          <p className="text-teal-700">Primary color - text-teal-700</p>
          <p className="text-coral-700">Secondary color - text-coral-700</p>
          <p className="text-gray-700">Faded color - text-gray-700</p>
          <div className="bg-teal-500 p-3 rounded text-white">
            <p>
              Inherit color from parent (text-white on bg-teal-500)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-gray-900 font-semibold">Default color - text-gray-900 font-semibold</p>
          <p className="text-teal-700 font-semibold">Primary color - text-teal-700 font-semibold</p>
          <p className="text-coral-700 font-semibold">Secondary color - text-coral-700 font-semibold</p>
          <p className="text-gray-700 font-semibold">Faded color - text-gray-700 font-semibold</p>
          <div className="bg-teal-500 p-3 rounded text-white">
            <p className="font-semibold">
              Inherit color from parent (text-white font-semibold)
            </p>
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Examples"
      inContext={true}
      description="Real-world typography usage patterns combining size, weight, and color."
    >
      <div className="flex flex-col gap-8 max-w-2xl">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Article Byline</h3>
          <div className="text-sm sm:text-base font-light text-gray-700 leading-tight">
            Written by <em className="not-italic font-normal">Gabriel Kolanen</em>, FI
          </div>
          <div className="text-sm font-light text-gray-700 leading-tight mt-1">
            Meditating for 5 years
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Body Text Paragraph</h3>
          <p className="text-sm sm:text-base font-light text-gray-700 leading-relaxed">
            This is a typical body paragraph using the default text sizing and styling.
            It uses responsive sizing (text-sm sm:text-base) that scales from mobile to desktop,
            light font weight (font-light) for comfortable reading, and relaxed line height (leading-relaxed)
            for improved readability.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Emphasis and Links</h3>
          <p className="text-sm sm:text-base font-light text-gray-700 leading-relaxed">
            You can emphasize text with <strong className="font-semibold">font-semibold</strong> or
            create <a href="#" className="text-teal-600 hover:text-teal-700 underline">interactive links</a> using
            color utilities. For subtle text, use <span className="text-gray-600">text-gray-600</span>.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Social Share Label</h3>
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-normal text-gray-700">
              Share:
            </span>
            <div className="text-sm text-gray-500">
              (Social icons would appear here)
            </div>
          </div>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Typography"
