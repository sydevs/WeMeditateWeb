import type { ReactNode } from 'react'

export interface StoryWrapperProps {
  /**
   * Story content to wrap
   */
  children: ReactNode
}

/**
 * Standard wrapper for all story components.
 * Provides consistent spacing and layout structure with standardized classes.
 *
 * @example
 * ```tsx
 * export const Default: Story = () => (
 *   <StoryWrapper>
 *     <StorySection title="Basic Examples">
 *       ...
 *     </StorySection>
 *   </StoryWrapper>
 * );
 * ```
 */
export function StoryWrapper({ children }: StoryWrapperProps) {
  // Horizontal gutter lives here (inside the Provider's inline-size container) so
  // `full-bleed` blocks escape it and reach the story-canvas edges, matching the
  // page model where the content gutter sits inside `<main>`. Ladle's own
  // `.ladle-main` horizontal padding is removed in .ladle/story-overrides.css.
  return <div className="flex flex-col gap-8 px-12 py-2">{children}</div>
}
