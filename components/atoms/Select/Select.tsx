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
      'px-0 py-3 pr-8 bg-transparent border-0 border-b-2 font-sans text-base transition-colors duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer'

    const stateStyles = {
      default:
        'text-gray-900 border-gray-300 hover:border-gray-400 focus:border-teal-500',
      error:
        'text-error border-error hover:border-error-dark focus:border-error',
      success:
        'text-gray-900 border-success hover:border-success focus:border-success',
    }

    const wrapperWidthStyles = fullWidth ? 'w-full' : 'inline-block'
    const selectWidthStyles = fullWidth ? 'w-full' : 'w-64'

    return (
      <div className={`relative ${wrapperWidthStyles}`}>
        <select
          ref={ref}
          className={`${baseStyles} ${stateStyles[state]} ${selectWidthStyles} ${className}`}
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
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-700">
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
