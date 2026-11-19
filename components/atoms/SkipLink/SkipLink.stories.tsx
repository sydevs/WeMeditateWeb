import type { Story, StoryDefault } from "@ladle/react";
import { SkipLink } from "./SkipLink";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Atoms"
} satisfies StoryDefault;

/**
 * The first tab stop on every page, jumping past the menus to the content.
 * It renders nothing visible until it takes focus, so press Tab inside each
 * section below to see it.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-fg-muted">
          Click here, then press Tab. The link appears at the top left of the viewport.
        </p>
        <SkipLink />
      </div>
    </StorySection>

    <StorySection title="Dark Theme" surface="dark" background="neutral">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-fg-muted">
          The revealed link paints its own white card, so it reads the same on either surface.
        </p>
        <SkipLink />
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <StorySection title="First Child Of A Page" variant="subsection">
        <div className="border border-gray-200 bg-white">
          <SkipLink />
          <div className="border-b border-gray-200 p-4 text-sm text-fg-muted">Site header</div>
          <div className="p-4" id="main-content" tabIndex={-1}>
            Page content
          </div>
        </div>
      </StorySection>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "SkipLink"
