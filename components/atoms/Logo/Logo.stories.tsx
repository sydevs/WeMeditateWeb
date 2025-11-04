import type { Story, StoryDefault } from "@ladle/react";
import { Logo } from "./Logo";
import { StoryWrapper, StorySection, StoryGrid, StoryGridHeader, StoryGridHeaderRow, StoryGridHeaderCell, StoryGridBody, StoryGridRow, StoryGridCell } from '../../ladle';

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Logo component showcasing all variants, sizes, and alignment options.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Logo variant="icon" />
          <span className="text-xs text-gray-500">Icon</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="text" />
          <span className="text-xs text-gray-500">Text</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="square" />
          <span className="text-xs text-gray-500">Square</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="circle" />
          <span className="text-xs text-gray-500">Circle</span>
        </div>
      </div>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex flex-col gap-8">
        <StorySection title="Icon" variant="subsection">
          <div className="flex items-end gap-4">
            <Logo variant="icon" size="sm" />
            <Logo variant="icon" size="md" />
            <Logo variant="icon" size="lg" />
            <Logo variant="icon" size="xl" />
          </div>
        </StorySection>

        <StorySection title="Text" variant="subsection">
          <div className="flex items-end gap-8">
            <Logo variant="text" size="sm" />
            <Logo variant="text" size="md" />
            <Logo variant="text" size="lg" />
            <Logo variant="text" size="xl" />
          </div>
        </StorySection>

        <StorySection title="Square" variant="subsection">
          <div className="flex items-end gap-4">
            <Logo variant="square" size="sm" />
            <Logo variant="square" size="md" />
            <Logo variant="square" size="lg" />
            <Logo variant="square" size="xl" />
          </div>
        </StorySection>

        <StorySection title="Circle" variant="subsection">
          <div className="flex items-end gap-4">
            <Logo variant="circle" size="sm" />
            <Logo variant="circle" size="md" />
            <Logo variant="circle" size="lg" />
            <Logo variant="circle" size="xl" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Text Alignment">
      <div className="flex justify-around items-start gap-8">
        <div className="flex flex-col items-start gap-2">
          <Logo variant="text" align="left" />
          <span className="text-xs text-gray-500">Left</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="text" align="center" />
          <span className="text-xs text-gray-500">Center</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Logo variant="text" align="right" />
          <span className="text-xs text-gray-500">Right</span>
        </div>
      </div>
    </StorySection>

    <StorySection title="States">
      <div className="flex flex-col gap-6">
        <StorySection title="With href (hover enabled)" variant="subsection">
          <div className="flex flex-wrap items-center gap-6">
            <Logo variant="icon" href="/" />
            <Logo variant="text" href="/" />
            <Logo variant="square" href="/" />
            <Logo variant="circle" href="/" />
          </div>
        </StorySection>

        <StorySection title="Without href (no hover)" variant="subsection">
          <div className="flex flex-wrap items-center gap-6">
            <Logo variant="icon" />
            <Logo variant="text" />
            <Logo variant="square" />
            <Logo variant="circle" />
          </div>
        </StorySection>

        <StorySection title="Color Inheritance (Gray Context)" variant="subsection">
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <Logo variant="icon" href="/" />
            <Logo variant="text" href="/" />
          </div>
        </StorySection>

        <StorySection title="Color Inheritance (Teal Context)" variant="subsection">
          <div className="flex flex-wrap items-center gap-6 text-teal-600">
            <Logo variant="icon" href="/" />
            <Logo variant="text" href="/" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-8">
        <StorySection title="Header Branding" variant="subsection">
          <div className="bg-white p-4 border border-gray-200 flex items-center gap-4 text-gray-600">
            <Logo variant="icon" href="/" size="md" />
            <div className="flex-1 text-center text-sm">
              Navigation menu items...
            </div>
          </div>
        </StorySection>

        <StorySection title="Footer Branding" variant="subsection">
          <div className="bg-gray-800 p-6 flex justify-center text-white">
            <Logo variant="text" href="/" size="md" />
          </div>
        </StorySection>

        <StorySection title="Sidebar Navigation" variant="subsection">
          <div className="bg-white p-6 border-r border-gray-200 w-48 flex flex-col gap-4">
            <Logo variant="text" href="/" size="sm" align="left" className="text-gray-600" />
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <a href="#" className="hover:text-teal-600">Menu Item 1</a>
              <a href="#" className="hover:text-teal-600">Menu Item 2</a>
              <a href="#" className="hover:text-teal-600">Menu Item 3</a>
            </div>
          </div>
        </StorySection>

        <StorySection title="Social Media Profile" variant="subsection">
          <div className="bg-gray-100 p-6 flex justify-center">
            <Logo variant="circle" size="xl" />
          </div>
        </StorySection>

        <StorySection title="App Icons" variant="subsection">
          <div className="flex gap-4">
            <Logo variant="square" size="lg" />
            <Logo variant="circle" size="lg" />
          </div>
        </StorySection>

        <StorySection title="Compact Header" variant="subsection">
          <div className="bg-white p-3 border border-gray-200 flex items-center justify-between">
            <Logo variant="icon" href="/" size="sm" className="text-gray-600" />
            <span className="text-sm text-gray-600">Menu</span>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Logo"
