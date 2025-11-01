import type { Story, StoryDefault } from "@ladle/react";
import { LanguageFlag } from "./LanguageFlag";

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * LanguageFlag component showcasing all supported languages, labels, sizes, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">All Languages (Flags Only)</h3>
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="en" />
          <p className="text-sm text-gray-600">English</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="es" />
          <p className="text-sm text-gray-600">Español</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="de" />
          <p className="text-sm text-gray-600">Deutsch</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="it" />
          <p className="text-sm text-gray-600">Italiano</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="fr" />
          <p className="text-sm text-gray-600">Français</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="ru" />
          <p className="text-sm text-gray-600">Русский</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="ro" />
          <p className="text-sm text-gray-600">Română</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="cs" />
          <p className="text-sm text-gray-600">Čeština</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="uk" />
          <p className="text-sm text-gray-600">Українська</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="bg" />
          <p className="text-sm text-gray-600">Български</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Labels</h3>
      <div className="flex gap-4 flex-wrap">
        <LanguageFlag language="en" showLabel />
        <LanguageFlag language="es" showLabel />
        <LanguageFlag language="de" showLabel />
        <LanguageFlag language="it" showLabel />
        <LanguageFlag language="fr" showLabel />
      </div>
    </div>

  </div>
);
Default.storyName = "Language Flag"
