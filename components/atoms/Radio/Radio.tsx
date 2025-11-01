import { ComponentProps, forwardRef } from 'react'

export interface RadioProps extends Omit<ComponentProps<'input'>, 'type'> {
  /**
   * Radio button label text
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
 * Radio component for single selections within a group.
 *
 * Provides consistent styling with optional label.
 * Must be used with same `name` attribute for grouping.
 *
 * @example
 * <Radio name="duration" value="5" label="5 minutes" />
 * <Radio name="duration" value="10" label="10 minutes" />
 * <Radio name="duration" value="15" label="15 minutes" />
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, hasError = false, color = 'primary', className = '', id, ...props }, ref) => {
    const colorStyles = {
      primary: 'accent-teal-600 focus:ring-teal-500',
      secondary: 'appearance-none checked:bg-coral-500 checked:border-coral-500 focus:ring-coral-500 rounded-full [&:checked]:bg-[url("data:image/svg+xml,%3csvg%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27white%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3e%3ccircle%20cx%3D%278%27%20cy%3D%278%27%20r%3D%273%27%2F%3e%3c%2Fsvg%3e")]',
    }

    const inputStyles =
      `w-4 h-4 bg-white border-gray-300 focus:ring-2 focus:ring-offset-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${colorStyles[color]}`

    const errorStyles = hasError ? 'border-error focus:ring-error' : ''

    const labelStyles =
      'ml-2 text-sm font-sans text-gray-900 cursor-pointer select-none'

    const radioElement = (
      <input
        ref={ref}
        type="radio"
        id={id}
        className={`${inputStyles} ${errorStyles} ${className}`}
        aria-invalid={hasError}
        {...props}
      />
    )

    if (label) {
      return (
        <div className="flex items-center">
          {radioElement}
          <label htmlFor={id} className={labelStyles}>
            {label}
          </label>
        </div>
      )
    }

    return radioElement
  }
)

Radio.displayName = 'Radio'
