import { ComponentProps, forwardRef } from 'react'

export interface SelectProps extends ComponentProps<'select'> {
  /**
   * Validation state
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success'

  /**
   * Full width select
   * @default false
   */
  fullWidth?: boolean

  /**
   * Placeholder text shown when no value is selected
   */
  placeholder?: string
}

/**
 * Select component for dropdown selections.
 *
 * Provides consistent styling with validation states.
 * Supports all native select attributes.
 *
 * @example
 * <Select placeholder="Choose an option">
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 *
 * <Select state="error" fullWidth>
 *   <option value="">Select language</option>
 *   <option value="en">English</option>
 *   <option value="es">Español</option>
 * </Select>
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      state = 'default',
      fullWidth = false,
      placeholder,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'px-4 py-2.5 pr-10 border rounded-lg font-sans text-base text-gray-900 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer'

    const stateStyles = {
      default:
        'border-gray-300 hover:border-gray-400 focus:border-teal-500 focus:ring-teal-500',
      error:
        'border-error hover:border-error-dark focus:border-error focus:ring-error',
      success:
        'border-success hover:border-success focus:border-success focus:ring-success',
    }

    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <div className={`relative ${widthStyles}`}>
        <select
          ref={ref}
          className={`${baseStyles} ${stateStyles[state]} ${widthStyles} ${className}`}
          aria-invalid={state === 'error'}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {/* Dropdown arrow icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'
