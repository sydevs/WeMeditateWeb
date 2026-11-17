import { cloneElement, isValidElement, ReactNode } from 'react'
import { useT } from '../../../hooks/useT'

export interface FormFieldProps {
  /**
   * Unique identifier for the form field
   * Required to associate label with input
   */
  id: string

  /** Label text for the field */
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

  /** Optional description or help text */
  description?: string

  /**
   * The form input element
   * Can be Input, Select, Textarea, Checkbox, Radio, etc.
   */
  children: ReactNode

  /** Additional CSS classes for the wrapper */
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
  const t = useT()

  const alignStyles = align === 'center' ? 'text-center' : 'text-left'
  const labelStyles = 'block text-sm font-medium text-gray-900 mb-1'
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''
  const descriptionStyles = 'mt-1 text-sm text-gray-700'
  const errorStyles = 'mt-1 text-sm text-error'

  // Only what this component actually renders: an error hides the description,
  // and `aria-describedby` pointing at a missing id announces nothing.
  const descriptionId = description && !error ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  // The description and the error are siblings of the control, so nothing
  // connects them to it but this attribute. A single element child takes it;
  // anything else keeps its own markup, and a control that already names its
  // own description keeps that too.
  const describedChildren =
    ariaDescribedBy && isValidElement<{ 'aria-describedby'?: string }>(children)
      ? cloneElement(children, {
          'aria-describedby':
            [children.props['aria-describedby'], ariaDescribedBy].filter(Boolean).join(' ') ||
            undefined,
        })
      : children

  return (
    <div className={`${alignStyles} ${className}`}>
      <label className={`${labelStyles} ${disabledStyles}`} htmlFor={id}>
        {label}
        {required && (
          <span aria-label={t('forms.a11y.required_marker')} className="text-error ml-1">
            *
          </span>
        )}
      </label>

      {description && !error && (
        <p className={descriptionStyles} id={descriptionId}>
          {description}
        </p>
      )}

      <div className={description && !error ? 'mt-1' : ''}>{describedChildren}</div>

      {error && (
        <p className={errorStyles} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
