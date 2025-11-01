import { ComponentProps, forwardRef } from 'react'

export interface TextareaProps extends ComponentProps<'textarea'> {
  /**
   * Validation state
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success'

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
      fullWidth = true,
      autoResize = false,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'px-4 py-2.5 border rounded-lg font-sans text-base text-gray-900 placeholder:text-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60'

    const stateStyles = {
      default:
        'border-gray-300 hover:border-gray-400 focus:border-teal-500 focus:ring-teal-500',
      error:
        'border-error hover:border-error-dark focus:border-error focus:ring-error',
      success:
        'border-success hover:border-success focus:border-success focus:ring-success',
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
        className={`${baseStyles} ${stateStyles[state]} ${widthStyles} ${resizeStyles} ${className}`}
        aria-invalid={state === 'error'}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
