import type { Story, StoryDefault } from "@ladle/react";
import { LanguageFlag } from "./LanguageFlag";
import { StorySection, StoryWrapper } from '../../../ladle';

export default {
  title: "Atoms / Graphics"
} satisfies StoryDefault;

/**
 * LanguageFlag component showcasing all supported languages, labels, sizes, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-gray-800 mb-3">Flags Only</p>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="en" />
              <p className="text-sm text-gray-800">English</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="es" />
              <p className="text-sm text-gray-800">Español</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="de" />
              <p className="text-sm text-gray-800">Deutsch</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="it" />
              <p className="text-sm text-gray-800">Italiano</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="fr" />
              <p className="text-sm text-gray-800">Français</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="ru" />
              <p className="text-sm text-gray-800">Русский</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="ro" />
              <p className="text-sm text-gray-800">Română</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="cs" />
              <p className="text-sm text-gray-800">Čeština</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="uk" />
              <p className="text-sm text-gray-800">Українська</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LanguageFlag language="bg" />
              <p className="text-sm text-gray-800">Български</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800 mb-3">With Labels</p>
          <div className="flex gap-4 flex-wrap">
            <LanguageFlag language="en" showLabel />
            <LanguageFlag language="es" showLabel />
            <LanguageFlag language="de" showLabel />
            <LanguageFlag language="it" showLabel />
            <LanguageFlag language="fr" showLabel />
          </div>
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
);
Default.storyName = "Language Flag"
