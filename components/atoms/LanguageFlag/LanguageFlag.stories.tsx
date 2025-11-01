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

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="en" size="sm" showLabel />
          <p className="text-sm text-gray-600">Small</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="en" size="md" showLabel />
          <p className="text-sm text-gray-600">Medium</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageFlag language="en" size="lg" showLabel />
          <p className="text-sm text-gray-600">Large</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Language Selector</h3>
      <div className="flex flex-col gap-8 max-w-2xl">
      <div>
      <div className="border border-gray-200 rounded-lg p-4 max-w-xs">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Select Language</h4>
        <div className="space-y-1">
          {["en", "es", "de", "it", "fr", "ru"].map((lang) => (
            <button
              key={lang}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <LanguageFlag language={lang as any} showLabel />
            </button>
          ))}
        </div>
      </div>
      </div>

      <hr className="border-gray-200" />

      <div>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">We Meditate</h4>
          <div className="flex gap-2">
            <button className="p-2 rounded hover:bg-gray-800 transition-colors">
              <LanguageFlag language="en" size="sm" />
            </button>
            <button className="p-2 rounded hover:bg-gray-800 transition-colors">
              <LanguageFlag language="es" size="sm" />
            </button>
            <button className="p-2 rounded hover:bg-gray-800 transition-colors">
              <LanguageFlag language="de" size="sm" />
            </button>
            <button className="p-2 rounded hover:bg-gray-800 transition-colors">
              <LanguageFlag language="fr" size="sm" />
            </button>
          </div>
        </div>
      </div>
      </div>

      <hr className="border-gray-200" />

      <div>
      <div className="border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">This content is available in:</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 border border-gray-300 rounded hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <LanguageFlag language="en" showLabel size="sm" />
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <LanguageFlag language="es" showLabel size="sm" />
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <LanguageFlag language="de" showLabel size="sm" />
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <LanguageFlag language="it" showLabel size="sm" />
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <LanguageFlag language="fr" showLabel size="sm" />
          </button>
        </div>
      </div>
      </div>

      <hr className="border-gray-200" />

      <div>
      <div className="grid grid-cols-5 gap-3 max-w-md">
        {["en", "es", "de", "it", "fr", "ru", "ro", "cs", "uk", "bg"].map((lang) => (
          <button
            key={lang}
            className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded hover:border-teal-500 hover:bg-teal-50 transition-colors"
          >
            <LanguageFlag language={lang as any} size="lg" />
          </button>
        ))}
      </div>
      </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Language Flag"
