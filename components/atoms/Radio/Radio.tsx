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
  ({ label, hasError = false, className = '', id, ...props }, ref) => {
    const inputStyles =
      'w-4 h-4 text-teal-600 bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'

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
