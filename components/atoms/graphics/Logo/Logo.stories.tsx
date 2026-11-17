import type { Story, StoryDefault } from '@ladle/react'
import { Logo } from './Logo'
import { StoryWrapper, StorySection } from '../../../ladle'

export default {
  title: 'Atoms / Graphics',
} satisfies StoryDefault

/** Logo component showcasing all variants, sizes, and alignment options. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Logo variant="icon" />
          <span className="text-xs text-gray-700">Icon</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="text" />
          <span className="text-xs text-gray-700">Text</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="square" />
          <span className="text-xs text-gray-700">Square</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo variant="circle" />
          <span className="text-xs text-gray-700">Circle</span>
        </div>
      </div>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex flex-col gap-8">
        <StorySection title="Icon" variant="subsection">
          <div className="flex items-end gap-4">
            <Logo size="sm" variant="icon" />
            <Logo size="md" variant="icon" />
            <Logo size="lg" variant="icon" />
            <Logo size="xl" variant="icon" />
          </div>
        </StorySection>

        <StorySection title="Text" variant="subsection">
          <div className="flex items-end gap-8">
            <Logo size="sm" variant="text" />
            <Logo size="md" variant="text" />
            <Logo size="lg" variant="text" />
            <Logo size="xl" variant="text" />
          </div>
        </StorySection>

        <StorySection title="Square" variant="subsection">
          <div className="flex items-end gap-4">
            <Logo size="sm" variant="square" />
            <Logo size="md" variant="square" />
            <Logo size="lg" variant="square" />
            <Logo size="xl" variant="square" />
          </div>
        </StorySection>

        <StorySection title="Circle" variant="subsection">
          <div className="flex items-end gap-4">
            <Logo size="sm" variant="circle" />
            <Logo size="md" variant="circle" />
            <Logo size="lg" variant="circle" />
            <Logo size="xl" variant="circle" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Text Alignment">
      <div className="flex justify-around items-start gap-8">
        <div className="flex flex-col items-start gap-2">
          <Logo align="left" variant="text" />
          <span className="text-xs text-gray-700">Left</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Logo align="center" variant="text" />
          <span className="text-xs text-gray-700">Center</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Logo align="right" variant="text" />
          <span className="text-xs text-gray-700">Right</span>
        </div>
      </div>
    </StorySection>

    <StorySection title="States">
      <div className="flex flex-col gap-6">
        <StorySection title="With href (hover enabled)" variant="subsection">
          <div className="flex flex-wrap items-center gap-6">
            <Logo href="/" variant="icon" />
            <Logo href="/" variant="text" />
            <Logo href="/" variant="square" />
            <Logo href="/" variant="circle" />
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
          <div className="flex flex-wrap items-center gap-6 text-gray-700">
            <Logo href="/" variant="icon" />
            <Logo href="/" variant="text" />
          </div>
        </StorySection>

        <StorySection title="Color Inheritance (Teal Context)" variant="subsection">
          <div className="flex flex-wrap items-center gap-6 text-teal-600">
            <Logo href="/" variant="icon" />
            <Logo href="/" variant="text" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex flex-col gap-8">
        <StorySection title="Header Branding" variant="subsection">
          <div className="bg-white p-4 border border-gray-200 flex items-center gap-4 text-gray-700">
            <Logo href="/" size="md" variant="icon" />
            <div className="flex-1 text-center text-sm">Navigation menu items...</div>
          </div>
        </StorySection>

        <StorySection title="Footer Branding" variant="subsection">
          <div className="surface-dark bg-teal-900 p-6 flex justify-center text-white">
            <Logo href="/" size="md" variant="text" />
          </div>
        </StorySection>

        <StorySection title="Sidebar Navigation" variant="subsection">
          <div className="bg-white p-6 border-r border-gray-200 w-48 flex flex-col gap-4">
            <Logo align="left" className="text-gray-700" href="/" size="sm" variant="text" />
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <a className="hover:text-teal-600" href="#">
                Menu Item 1
              </a>
              <a className="hover:text-teal-600" href="#">
                Menu Item 2
              </a>
              <a className="hover:text-teal-600" href="#">
                Menu Item 3
              </a>
            </div>
          </div>
        </StorySection>

        <StorySection title="Social Media Profile" variant="subsection">
          <div className="bg-gray-100 p-6 flex justify-center">
            <Logo size="xl" variant="circle" />
          </div>
        </StorySection>

        <StorySection title="App Icons" variant="subsection">
          <div className="flex gap-4">
            <Logo size="lg" variant="square" />
            <Logo size="lg" variant="circle" />
          </div>
        </StorySection>

        <StorySection title="Compact Header" variant="subsection">
          <div className="bg-white p-3 border border-gray-200 flex items-center justify-between">
            <Logo className="text-gray-700" href="/" size="sm" variant="icon" />
            <span className="text-sm text-gray-700">Menu</span>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Logo'
