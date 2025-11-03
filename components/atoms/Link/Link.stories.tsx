import type { Story, StoryDefault } from "@ladle/react";
import { Link } from "./Link";
import { StoryWrapper, StorySection, StorySubsection } from '../../ladle';

export default {
  title: "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Link component showcasing all variants, sizes, and locale handling.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <div className="flex flex-col gap-4">
        <div>
          <Link href="/meditations" variant="default">
            Default link with underline on hover
          </Link>
        </div>
        <div>
          <Link href="/about" variant="primary">
            Primary link (teal, medium weight)
          </Link>
        </div>
        <div>
          <Link href="/contact" variant="secondary">
            Secondary link (coral, medium weight)
          </Link>
        </div>
        <div>
          <Link href="/help" variant="neutral">
            Neutral link (gray tones)
          </Link>
        </div>
        <div>
          <Link href="/custom" variant="unstyled" className="text-purple-600 underline">
            Unstyled link with custom styling
          </Link>
        </div>
      </div>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Explicit Sizes">
          <div className="flex flex-col gap-3">
            <div>
              <Link href="/small" size="sm">
                Small link (text-sm)
              </Link>
            </div>
            <div>
              <Link href="/base" size="base">
                Base size link (text-base)
              </Link>
            </div>
            <div>
              <Link href="/large" size="lg">
                Large link (text-lg)
              </Link>
            </div>
          </div>
        </StorySubsection>

        <StorySubsection label="Inherit Size">
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              <span>Parent is text-sm: </span>
              <Link href="/inherit-sm" size="inherit">
                Link inherits small size
              </Link>
            </div>
            <div className="text-base">
              <span>Parent is text-base: </span>
              <Link href="/inherit-base" size="inherit">
                Link inherits base size
              </Link>
            </div>
            <div className="text-2xl">
              <span>Parent is text-2xl: </span>
              <Link href="/inherit-2xl" size="inherit">
                Link inherits 2xl size
              </Link>
            </div>
          </div>
        </StorySubsection>
      </div>
    </StorySection>

    <StorySection title="External Links">
      <div className="flex flex-col gap-3">
        <div>
          <Link href="https://example.com" external>
            External link (opens in new tab with security)
          </Link>
          <span className="text-xs text-gray-500 ml-2">
            (includes target="_blank" and rel="noopener noreferrer")
          </span>
        </div>
        <div>
          <Link href="https://github.com" external variant="primary">
            External primary link
          </Link>
        </div>
        <div>
          <Link href="https://stackoverflow.com" external variant="secondary">
            External secondary link
          </Link>
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Locale Handling"
      description="Automatic locale prefixing for internationalization"
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">English (en) - No prefix:</div>
          <Link href="/meditations" locale="en">
            /meditations
          </Link>
          <span className="text-xs text-gray-500 ml-2">(renders as /meditations)</span>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">Spanish (es) - With prefix:</div>
          <Link href="/meditations" locale="es">
            /meditations
          </Link>
          <span className="text-xs text-gray-500 ml-2">(renders as /es/meditations)</span>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">French (fr) - With prefix:</div>
          <Link href="/about" locale="fr">
            /about
          </Link>
          <span className="text-xs text-gray-500 ml-2">(renders as /fr/about)</span>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">German (de) - With prefix:</div>
          <Link href="/contact" locale="de">
            /contact
          </Link>
          <span className="text-xs text-gray-500 ml-2">(renders as /de/contact)</span>
        </div>

        <div className="mt-2 p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> External URLs (http/https) and anchor links (#) are never prefixed,
            regardless of locale.
          </p>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Link"
