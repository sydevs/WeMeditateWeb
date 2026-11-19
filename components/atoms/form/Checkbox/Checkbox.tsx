import { ComponentProps, useId } from 'react'

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  /** Checkbox label text */
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
export function Checkbox({
  label,
  hasError = false,
  color = 'primary',
  className = '',
  id,
  ref,
  ...props
}: CheckboxProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  const colorStyles = {
    primary: 'accent-teal-600 focus:ring-teal-500',
    secondary: 'accent-coral-600 focus:ring-coral-500',
  }

  const inputStyles = `w-4 h-4 bg-white border-gray-300 rounded focus:ring-2 focus:ring-offset-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${colorStyles[color]}`

  const errorStyles = hasError ? 'border-error focus:ring-error' : ''

  const labelStyles = 'ml-2 text-sm font-sans text-gray-900 cursor-pointer select-none'

  const checkboxElement = (
    <input
      ref={ref}
      aria-invalid={hasError}
      className={`${inputStyles} ${errorStyles} ${className}`}
      id={inputId}
      type="checkbox"
      {...props}
    />
  )

  if (label) {
    return (
      <div className="flex items-center">
        {checkboxElement}
        <label className={labelStyles} htmlFor={inputId}>
          {label}
        </label>
      </div>
    )
  }

  return checkboxElement
}
