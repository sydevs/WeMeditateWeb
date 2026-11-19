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
}

/**
 * FormField molecule that combines a label, input and optional error message.
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
 * <FormField id="message" label="Message" error="Message is required">
 *   <Textarea id="message" />
 * </FormField>
 */
export function FormField({
  id,
  label,
  required = false,
  error,
  children,
  className = '',
  disabled = false,
}: FormFieldProps) {
  const t = useT()

  const labelStyles = 'block text-sm font-medium text-gray-900 mb-1'
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''
  const errorStyles = 'mt-1 text-sm text-error'

  const errorId = error ? `${id}-error` : undefined

  // The error is a sibling of the control, so nothing connects it to the
  // control but this attribute. A control that already names its own
  // description keeps that too.
  // shortcut: only a single element child is reached, so a field wrapping a
  // fragment or several controls gets nothing. Upgrade to a context when a
  // call site needs one — every one today renders one control.
  const describedChildren =
    errorId && isValidElement<{ 'aria-describedby'?: string }>(children)
      ? // The control is the caller's element, so nothing but `cloneElement`
        // can put an attribute on it. A wrapper cannot carry
        // `aria-describedby`: it has to sit on the control the label names.
        // eslint-disable-next-line @eslint-react/no-clone-element
        cloneElement(children, {
          'aria-describedby': [children.props['aria-describedby'], errorId]
            .filter(Boolean)
            .join(' '),
        })
      : children

  return (
    <div className={`text-left ${className}`}>
      <label className={`${labelStyles} ${disabledStyles}`} htmlFor={id}>
        {label}
        {required && (
          <span aria-label={t('forms.a11y.required_marker')} className="text-error ml-1">
            *
          </span>
        )}
      </label>

      <div>{describedChildren}</div>

      {error && (
        <p className={errorStyles} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
