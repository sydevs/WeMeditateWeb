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
    <table>
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
  <thead>
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
    ? "px-3 py-2 text-center font-semibold text-gray-700"
    : "px-3 py-2 text-center text-sm font-medium text-gray-600";

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
  <tbody>
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
  <tr>
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
    ? "px-3 py-2 text-sm font-medium text-gray-700"
    : "px-3 py-2 text-center";

  return (
    <td className={className}>
      {children}
    </td>
  );
};
