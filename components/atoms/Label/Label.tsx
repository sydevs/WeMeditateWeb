import { ComponentProps } from 'react'

export interface LabelProps extends ComponentProps<'label'> {
  /**
   * Whether the associated field is required
   * @default false
   */
  required?: boolean

  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean
}

/**
 * Label component for form inputs.
 *
 * Provides consistent styling for form labels with required indicator.
 * Should be associated with form inputs via htmlFor prop.
 *
 * For complete form field layouts with label, error messages, and descriptions,
 * use the FormField organism component instead.
 *
 * @example
 * <Label htmlFor="email">Email address</Label>
 * <Label htmlFor="name" required>Full name</Label>
 * <Label htmlFor="comment" disabled>Comment (unavailable)</Label>
 *
 * @see FormField - For complete form field layouts
 */
export function Label({
  required = false,
  disabled = false,
  className = '',
  children,
  ...props
}: LabelProps) {
  const baseStyles = 'block text-sm font-medium text-gray-900 mb-1'
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <label
      className={`${baseStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
      {required && (
        <span className="text-error ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  )
}
