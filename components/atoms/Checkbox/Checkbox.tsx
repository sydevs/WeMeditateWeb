import { ComponentProps, forwardRef } from 'react'

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  /**
   * Checkbox label text
   */
  label?: string

  /**
   * Error state
   * @default false
   */
  hasError?: boolean
}

/**
 * Checkbox component for boolean selections.
 *
 * Provides consistent styling with optional label.
 * Can be used standalone or with external Label component.
 *
 * @example
 * <Checkbox label="I agree to the terms" />
 * <Checkbox id="newsletter" label="Subscribe to newsletter" />
 * <Checkbox hasError label="Required field" />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hasError = false, className = '', id, ...props }, ref) => {
    const inputStyles =
      'w-4 h-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'

    const errorStyles = hasError ? 'border-error focus:ring-error' : ''

    const labelStyles =
      'ml-2 text-sm font-sans text-gray-900 cursor-pointer select-none'

    const checkboxElement = (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={`${inputStyles} ${errorStyles} ${className}`}
        aria-invalid={hasError}
        {...props}
      />
    )

    if (label) {
      return (
        <div className="flex items-center">
          {checkboxElement}
          <label htmlFor={id} className={labelStyles}>
            {label}
          </label>
        </div>
      )
    }

    return checkboxElement
  }
)

Checkbox.displayName = 'Checkbox'
