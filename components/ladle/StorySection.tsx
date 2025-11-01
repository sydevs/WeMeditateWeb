import type { ReactNode } from 'react';

/**
 * StorySection component for consistent story structure in Ladle.
 *
 * @param title - The section title
 * @param description - Optional description text below the title
 * @param children - The section content
 */
export interface StorySectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const StorySection = ({ title, description, children }: StorySectionProps) => (
  <>
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {children}
    </div>
    <hr className="border-gray-200" />
  </>
);
