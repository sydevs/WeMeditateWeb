import type { ReactNode } from 'react';

/**
 * StoryExampleSection component for "Examples" sections in Ladle stories.
 * This is a thin wrapper that adds visual styling to distinguish example sections
 * from regular sections. The title is automatically set to "Examples".
 *
 * For multiple example sections, use a subtitle parameter to differentiate them
 * (e.g., subtitle="Button with Icons" will display as "Examples - Button with Icons")
 *
 * @param subtitle - Optional subtitle to append after "Examples -"
 * @param description - Optional description text below the title
 * @param children - The section content
 */
export interface StoryExampleSectionProps {
  subtitle?: string;
  description?: string;
  children: ReactNode;
}

export const StoryExampleSection = ({ subtitle, description, children }: StoryExampleSectionProps) => {
  const title = subtitle ? `In Context - ${subtitle}` : 'In Context';

  return (
    <>
      <div className="pt-8">
        <h3 className="border-t-2 border-grey-500 text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
        {children}
      </div>
      <hr className="border-gray-200" />
    </>
  );
};
