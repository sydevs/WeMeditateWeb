import { ComponentProps, forwardRef } from 'react'

export interface InputProps extends ComponentProps<'input'> {
  /**
   * Validation state
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success'

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'minimal'

  /**
   * Full width input
   * @default false
   */
  fullWidth?: boolean
}

/**
 * Input component for text entry.
 *
 * Provides consistent styling with validation states.
 * Supports all native input types and attributes.
 *
 * @example
 * <Input type="text" placeholder="Enter your name" />
 * <Input type="email" state="error" />
 * <Input type="password" state="success" fullWidth />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ state = 'default', variant = 'default', fullWidth = false, className = '', ...props }, ref) => {
    const baseStyles =
      'px-3 py-3 bg-transparent font-sans text-base placeholder:text-gray-500 transition-colors duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed'

    const variantStyles = {
      default: 'border',
      minimal: 'border-0 border-b-2',
    }

    const stateStyles = {
      default:
        'text-gray-900 border-gray-300 hover:border-gray-400 focus:border-teal-500',
      error:
        'text-error border-error hover:border-error-dark focus:border-error',
      success:
        'text-gray-900 border-success hover:border-success focus:border-success',
    }

    const widthStyles = fullWidth ? 'w-full' : 'w-64'

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${stateStyles[state]} ${widthStyles} ${className}`}
        aria-invalid={state === 'error'}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
