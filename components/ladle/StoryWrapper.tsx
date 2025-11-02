import type { ReactNode } from 'react';

export interface StoryWrapperProps {
  /**
   * Story content to wrap
   */
  children: ReactNode;
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
  return (
    <div className="flex flex-col gap-8 p-2">
      {children}
    </div>
  );
}
