import type { ReactNode } from 'react';

/**
 * StoryGrid component for creating consistent grid layouts in stories.
 * Based on the Button story table pattern.
 */
export interface StoryGridProps {
  children: ReactNode;
}

export const StoryGrid = ({ children }: StoryGridProps) => (
  <div className="overflow-x-auto">
    <table className="min-w-full sm:table">
      {children}
    </table>
  </div>
);

/**
 * StoryGridHeader component for table headers.
 */
export interface StoryGridHeaderProps {
  children: ReactNode;
}

export const StoryGridHeader = ({ children }: StoryGridHeaderProps) => (
  <thead className="hidden sm:table-header-group">
    {children}
  </thead>
);

/**
 * StoryGridHeaderRow component for header rows.
 */
export interface StoryGridHeaderRowProps {
  children: ReactNode;
}

export const StoryGridHeaderRow = ({ children }: StoryGridHeaderRowProps) => (
  <tr>
    {children}
  </tr>
);

/**
 * StoryGridHeaderCell component for individual header cells.
 */
export interface StoryGridHeaderCellProps {
  children?: ReactNode;
  colSpan?: number;
  /** Size variant for header cells */
  size?: 'primary' | 'secondary';
}

export const StoryGridHeaderCell = ({
  children,
  colSpan,
  size = 'primary'
}: StoryGridHeaderCellProps) => {
  const className = size === 'primary'
    ? "px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base font-semibold text-gray-700"
    : "px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-medium text-gray-600";

  return (
    <th colSpan={colSpan} className={className}>
      {children}
    </th>
  );
};

/**
 * StoryGridBody component for table body.
 */
export interface StoryGridBodyProps {
  children: ReactNode;
}

export const StoryGridBody = ({ children }: StoryGridBodyProps) => (
  <tbody className="block sm:table-row-group">
    {children}
  </tbody>
);

/**
 * StoryGridRow component for body rows.
 */
export interface StoryGridRowProps {
  children: ReactNode;
}

export const StoryGridRow = ({ children }: StoryGridRowProps) => (
  <tr className="block sm:table-row mb-4 sm:mb-0 border-b sm:border-b-0 pb-4 sm:pb-0">
    {children}
  </tr>
);

/**
 * StoryGridCell component for body cells.
 */
export interface StoryGridCellProps {
  children?: ReactNode;
  /** Whether this is a row label cell */
  isLabel?: boolean;
}

export const StoryGridCell = ({ children, isLabel = false }: StoryGridCellProps) => {
  const className = isLabel
    ? "block sm:table-cell px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold sm:font-medium text-gray-700"
    : "block sm:table-cell px-2 sm:px-3 py-1.5 sm:py-2 text-left sm:text-center";

  return (
    <td className={className}>
      {children}
    </td>
  );
};
