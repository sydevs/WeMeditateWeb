import { ComponentProps, ReactNode } from 'react'

export interface FormFieldProps {
  /**
   * Unique identifier for the form field
   * Required to associate label with input
   */
  id: string

  /**
   * Label text for the field
   */
  label: string

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean

  /**
   * Error message to display
   * When provided, renders the error message in red
   */
  error?: string

  /**
   * Optional description or help text
   */
  description?: string

  /**
   * The form input element
   * Can be Input, Select, Textarea, Checkbox, Radio, etc.
   */
  children: ReactNode

  /**
   * Additional CSS classes for the wrapper
   */
  className?: string

  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Text alignment for the form field
   * @default 'left'
   */
  align?: 'left' | 'center'
}

/**
 * FormField molecule that combines a label, input, optional error message, and optional description.
 *
 * Provides consistent form field layout with proper accessibility attributes.
 * Handles validation states and displays error messages in red.
 *
 * @example
 * <FormField id="email" label="Email" required>
 *   <Input type="email" id="email" />
 * </FormField>
 *
 * @example
 * <FormField
 *   id="message"
 *   label="Message"
 *   description="Please provide detailed information"
 *   error="Message is required"
 * >
 *   <Textarea id="message" />
 * </FormField>
 */
export function FormField({
  id,
  label,
  required = false,
  error,
  description,
  children,
  className = '',
  disabled = false,
  align = 'left',
}: FormFieldProps) {
  const alignStyles = align === 'center' ? 'text-center' : 'text-left'
  const labelStyles = 'block text-sm font-medium text-gray-900 mb-1'
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''
  const descriptionStyles = 'mt-1 text-sm text-gray-600'
  const errorStyles = 'mt-1 text-sm text-error'

  // Generate IDs for description and error for aria-describedby
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  // Build aria-describedby value
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`${alignStyles} ${className}`}>
      <label
        htmlFor={id}
        className={`${labelStyles} ${disabledStyles}`}
      >
        {label}
        {required && (
          <span className="text-error ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && !error && (
        <p id={descriptionId} className={descriptionStyles}>
          {description}
        </p>
      )}

      <div className={description && !error ? 'mt-1' : ''}>
        {children}
      </div>

      {error && (
        <p id={errorId} className={errorStyles} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
