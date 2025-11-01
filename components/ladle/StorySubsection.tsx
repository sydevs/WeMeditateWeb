import type { ReactNode } from 'react';

/**
 * StorySubsection component for labeling subsections within a story section.
 *
 * @param label - The subsection label
 * @param children - The subsection content
 */
export interface StorySubsectionProps {
  label: string;
  children: ReactNode;
}

export const StorySubsection = ({ label, children }: StorySubsectionProps) => (
  <div>
    <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
    {children}
  </div>
);
