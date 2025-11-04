import type { ReactNode } from 'react';

/**
 * Unified StorySection component for consistent story structure in Ladle.
 *
 * Replaces StorySection, StoryDarkSection, StorySubsection, and StoryExampleSection
 * with a single flexible component that handles all use cases.
 *
 * @param title - Section title (renders as h2 for sections, p for subsections)
 * @param description - Optional description text below the title
 * @param children - The section content
 * @param theme - Text color theme: 'light' (dark text) or 'dark' (white text)
 * @param background - Background style: 'none', 'neutral' (gray), or 'gradient' (teal)
 * @param variant - Section type: 'section', 'subsection', or 'scrollable'
 * @param inContext - When true, adds "In Context" prefix to title and bold top border
 */
export interface StorySectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  theme?: 'light' | 'dark';
  background?: 'none' | 'neutral' | 'gradient';
  variant?: 'section' | 'subsection' | 'scrollable';
  inContext?: boolean;
}

export const StorySection = ({
  title,
  description,
  children,
  theme = 'light',
  background = 'none',
  variant = 'section',
  inContext = false
}: StorySectionProps) => {
  // Background styles based on theme and background type
  const getBackgroundStyles = () => {
    if (background === 'none') return '';

    const baseStyles = 'p-6 rounded-lg';

    if (background === 'neutral') {
      return theme === 'dark'
        ? `bg-gray-800 ${baseStyles}`
        : `bg-gray-50 ${baseStyles}`;
    }

    if (background === 'gradient') {
      return theme === 'dark'
        ? `bg-linear-to-b from-teal-600 to-teal-700 ${baseStyles}`
        : `bg-linear-to-b from-teal-50 to-teal-100 ${baseStyles}`;
    }

    return '';
  };

  // Text colors based on theme
  // For non-subsection dark sections with background, title/description appear on light wrapper background
  const getTitleColor = () => {
    if (variant === 'subsection') {
      return theme === 'dark' ? 'text-gray-100' : 'text-gray-700';
    }
    // Non-subsection dark theme sections have title/description on light background wrapper
    // So they should use light theme colors
    return 'text-gray-900';
  };

  const descriptionColor = 'text-gray-600'; // Always on light background for non-subsections

  // Variant-specific configuration
  const variantConfig = {
    section: {
      tag: 'h2' as const,
      titleClass: 'text-lg font-semibold mb-4',
      showDivider: true,
      wrapperClass: '',
      isScrollable: false
    },
    subsection: {
      tag: 'p' as const,
      titleClass: 'text-sm font-medium mb-3',
      showDivider: false,
      wrapperClass: 'mt-5',
      isScrollable: false
    },
    scrollable: {
      tag: 'h2' as const,
      titleClass: 'text-lg font-semibold mb-4',
      showDivider: true,
      wrapperClass: '',
      isScrollable: true
    }
  };

  const config = variantConfig[variant];
  const TitleTag = config.tag;
  const titleColor = getTitleColor();
  const backgroundStyles = getBackgroundStyles();

  // Add "In Context - " prefix when inContext is true
  const displayTitle = inContext && title
    ? `In Context - ${title}`
    : inContext
      ? 'In Context'
      : title;

  // Get text color for children based on theme
  const childrenTextColor = theme === 'dark' ? 'text-white' : '';

  // For scrollable variant, wrap content in scrollable container
  const renderContent = () => {
    if (config.isScrollable) {
      // Determine border and background for scrollable container
      const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
      const scrollBackground = backgroundStyles || (theme === 'dark' ? 'bg-linear-to-b from-teal-600 to-teal-700' : 'bg-white');

      return (
        <div className={`h-[600px] overflow-y-auto border-4 ${borderColor} -m-6`}>
          <div className={`min-h-full px-6 ${scrollBackground} ${childrenTextColor}`}>
            {children}
          </div>
        </div>
      );
    }

    // Regular content with optional background and text color
    if (backgroundStyles) {
      return <div className={`${backgroundStyles} ${childrenTextColor}`}>{children}</div>;
    }

    return <div className={childrenTextColor}>{children}</div>;
  };

  return (
    <>
      <div className={config.wrapperClass}>
        {/* Bold top border for "In Context" sections */}
        {inContext && (
          <div className="border-t-4 border-gray-900 mb-6 pt-8" />
        )}
        <TitleTag className={`${config.titleClass} ${titleColor}`}>
          {displayTitle}
        </TitleTag>
        {description && (
          <p className={`text-sm ${descriptionColor} mb-4`}>{description}</p>
        )}
        {renderContent()}
      </div>
      {config.showDivider && <hr className="border-gray-200" />}
    </>
  );
};
