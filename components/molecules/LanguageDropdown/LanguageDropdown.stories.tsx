import type { Story, StoryDefault } from '@ladle/react'
import { LanguageDropdown } from './LanguageDropdown'
import { StorySection, StoryWrapper } from '../../ladle'

export default {
  title: 'Molecules / Interactive',
} satisfies StoryDefault

const sampleLanguages = [
  { code: 'en' as const, label: 'English', href: '/about' },
  { code: 'es' as const, label: 'Español', href: '/es/about' },
  { code: 'de' as const, label: 'Deutsch', href: '/de/about' },
  { code: 'it' as const, label: 'Italiano', href: '/it/about' },
  { code: 'fr' as const, label: 'Français', href: '/fr/about' },
]

const allLanguages = [
  { code: 'en' as const, label: 'English', href: '/about' },
  { code: 'es' as const, label: 'Español', href: '/es/about' },
  { code: 'de' as const, label: 'Deutsch', href: '/de/about' },
  { code: 'it' as const, label: 'Italiano', href: '/it/about' },
  { code: 'fr' as const, label: 'Français', href: '/fr/about' },
  { code: 'ru' as const, label: 'Русский', href: '/ru/about' },
  { code: 'ro' as const, label: 'Română', href: '/ro/about' },
  { code: 'cs' as const, label: 'Čeština', href: '/cs/about' },
  { code: 'uk' as const, label: 'Українська', href: '/uk/about' },
  { code: 'bg' as const, label: 'Български', href: '/bg/about' },
]

/**
 * LanguageDropdown molecule for selecting website language with flags.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Usage">
      <div className="flex flex-col gap-8">
        <StorySection title="Minimal (Few Languages)" variant="subsection">
          <LanguageDropdown
            currentLanguage="en"
            languages={[
              { code: 'en', label: 'English', href: '/about' },
              { code: 'es', label: 'Español', href: '/es/about' },
            ]}
          />
        </StorySection>

        <StorySection title="Maximal (All Languages)" variant="subsection">
          <LanguageDropdown currentLanguage="en" languages={allLanguages} />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Different Current Languages">
      <div className="flex flex-col gap-8">
        <StorySection title="English Selected" variant="subsection">
          <LanguageDropdown currentLanguage="en" languages={sampleLanguages} />
        </StorySection>

        <StorySection title="Spanish Selected" variant="subsection">
          <LanguageDropdown currentLanguage="es" languages={sampleLanguages} />
        </StorySection>

        <StorySection title="French Selected" variant="subsection">
          <LanguageDropdown currentLanguage="fr" languages={sampleLanguages} />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Alignment Options">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned (Default)" variant="subsection">
          <LanguageDropdown currentLanguage="en" languages={sampleLanguages} align="left" />
        </StorySection>

        <StorySection title="Right Aligned" variant="subsection">
          <div className="flex justify-end">
            <LanguageDropdown currentLanguage="en" languages={sampleLanguages} align="right" />
          </div>
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-12">
        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Footer Language Selector</h3>
          <div className="flex justify-end bg-gray-50 p-6 rounded-lg">
            <LanguageDropdown currentLanguage="en" languages={allLanguages} align="right" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Header Language Selector</h3>
          <div className="bg-teal-600 p-6 rounded-lg">
            <LanguageDropdown
              currentLanguage="es"
              languages={sampleLanguages}
              align="right"
              className="text-white [&_button]:text-white [&_button:hover]:text-gray-100"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Sidebar Language Selector</h3>
          <div className="border border-gray-200 p-6 rounded-lg max-w-xs">
            <LanguageDropdown currentLanguage="de" languages={sampleLanguages} />
          </div>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Language Dropdown'
