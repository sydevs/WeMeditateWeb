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

  /**
   * Color variant
   * @default 'primary'
   */
  color?: 'primary' | 'secondary'
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
  ({ label, hasError = false, color = 'primary', className = '', id, ...props }, ref) => {
    const colorStyles = {
      primary: 'accent-teal-600 focus:ring-teal-500',
      secondary: 'appearance-none checked:bg-coral-500 checked:border-coral-500 focus:ring-coral-500 [&:checked]:bg-[url("data:image/svg+xml,%3csvg%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27white%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3e%3cpath%20d%3D%27M12.207%205.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%2010.086l4.293-4.293a1%201%200%20011.414%200z%27%2F%3e%3c%2Fsvg%3e")]',
    }

    const inputStyles =
      `w-4 h-4 bg-white border-gray-300 rounded focus:ring-2 focus:ring-offset-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${colorStyles[color]}`

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
