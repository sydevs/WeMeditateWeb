import { ComponentProps, forwardRef } from 'react'

export interface TextareaProps extends ComponentProps<'textarea'> {
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
   * Full width textarea
   * @default true
   */
  fullWidth?: boolean

  /**
   * Auto-resize textarea to fit content
   * @default false
   */
  autoResize?: boolean
}

/**
 * Textarea component for multi-line text entry.
 *
 * Provides consistent styling with validation states.
 * Optionally auto-resizes to fit content.
 *
 * @example
 * <Textarea placeholder="Enter your message" rows={4} />
 * <Textarea state="error" />
 * <Textarea autoResize placeholder="Type here..." />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      state = 'default',
      variant = 'default',
      fullWidth = true,
      autoResize = false,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'py-3 bg-transparent font-sans text-base placeholder:text-gray-500 transition-colors duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed'

    const variantStyles = {
      default: 'px-3 border',
      minimal: 'px-0 border-0 border-b-2',
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
    const resizeStyles = autoResize ? 'resize-none overflow-hidden' : 'resize-y'

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = 'auto'
        e.target.style.height = e.target.scrollHeight + 'px'
      }
      onChange?.(e)
    }

    return (
      <textarea
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${stateStyles[state]} ${widthStyles} ${resizeStyles} ${className}`}
        aria-invalid={state === 'error'}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
