import { useState } from 'react'
import { useForm, UseFormRegister } from 'react-hook-form'
import { Input } from '../../atoms/Input'
import { Textarea } from '../../atoms/Textarea'
import { Select } from '../../atoms/Select'
import { Checkbox } from '../../atoms/Checkbox'
import { Button } from '../../atoms/Button'
import { FormField } from '../../molecules/FormField'

/**
 * PayloadCMS Form Builder field configuration
 */
export interface FormBuilderField {
  /** Unique field identifier */
  name: string

  /** Field type from PayloadCMS form builder */
  blockType: 'text' | 'textarea' | 'select' | 'email' | 'checkbox' | 'number' | 'message'

  /** Field label (localized from PayloadCMS) */
  label: string

  /** Whether field is required */
  required?: boolean

  /** Default value */
  defaultValue?: string | boolean | number

  /** Field width (CSS class or percentage) */
  width?: string

  /** Placeholder text */
  placeholder?: string

  /** Select/Radio options */
  options?: Array<{
    label: string
    value: string
  }>

  /** Message field content (for blockType: 'message') */
  message?: string
}

/**
 * PayloadCMS Form Builder configuration
 */
export interface FormBuilderConfig {
  /** Unique form identifier */
  id: string

  /** Form title */
  title?: string

  /** Array of form fields */
  fields: FormBuilderField[]

  /** Submit button text */
  submitButtonLabel?: string

  /** Confirmation message after successful submission */
  confirmationMessage?: string

  /** Redirect URL after successful submission */
  redirect?: {
    url: string
  }
}

/**
 * Form submission data structure expected by PayloadCMS
 */
export interface FormBuilderSubmission {
  form: string
  submissionData: Array<{
    field: string
    value: string | boolean | number
  }>
}

/**
 * API error response with field-level errors
 */
export interface FormBuilderApiError {
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}

/**
 * FormBuilder organism component props
 */
export interface FormBuilderProps {
  /** Form configuration from PayloadCMS */
  form: FormBuilderConfig

  /**
   * Callback fired on form submission
   * Should handle POST request to PayloadCMS form submissions API
   *
   * @param data - Formatted submission data
   * @returns Promise resolving to success or error
   */
  onSubmit: (data: FormBuilderSubmission) => Promise<{
    success: boolean
    error?: FormBuilderApiError
  }>

  /**
   * Additional CSS classes for the form wrapper
   */
  className?: string
}

/**
 * Renders a form field based on its type
 */
function renderField(
  field: FormBuilderField,
  register: UseFormRegister<any>,
  fieldError?: string
) {
  // Filter defaultValue to only allow string/number for non-checkbox fields
  const getDefaultValue = () => {
    if (field.blockType === 'checkbox') return undefined
    if (typeof field.defaultValue === 'boolean') return undefined
    return field.defaultValue
  }

  const commonProps = {
    id: field.name,
    placeholder: field.placeholder,
    defaultValue: getDefaultValue(),
    'aria-invalid': !!fieldError,
    ...register(field.name, {
      required: field.required ? `${field.label} is required` : false,
    }),
  }

  switch (field.blockType) {
    case 'text':
      return <Input {...commonProps} type="text" />

    case 'email':
      return <Input {...commonProps} type="email" />

    case 'number':
      return (
        <Input
          {...commonProps}
          type="number"
          step="any"
        />
      )

    case 'textarea':
      return <Textarea {...commonProps} rows={4} />

    case 'select':
      return (
        <Select {...commonProps} placeholder={field.placeholder || 'Select an option'}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )

    case 'checkbox':
      return (
        <Checkbox
          {...register(field.name)}
          id={field.name}
          label={field.label}
          defaultChecked={field.defaultValue === true}
          aria-invalid={!!fieldError}
        />
      )

    case 'message':
      return (
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          {field.message}
        </p>
      )

    default:
      return null
  }
}

/**
 * FormBuilder organism component that dynamically renders forms from PayloadCMS form builder plugin.
 *
 * Supports all standard field types (text, textarea, select, email, checkbox, number, message)
 * and handles form submission, validation, confirmation messages, and redirects.
 *
 * @example
 * <FormBuilder
 *   form={formConfig}
 *   onSubmit={async (data) => {
 *     const response = await fetch('/api/form-submissions', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     })
 *     return { success: response.ok }
 *   }}
 * />
 */
export function FormBuilder({ form, onSubmit, className = '' }: FormBuilderProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
  })

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: Record<string, any>) => {
    // Clear previous errors
    setApiErrors({})
    setFormError('')

    // Format data for PayloadCMS
    const submissionData: FormBuilderSubmission = {
      form: form.id,
      submissionData: Object.entries(data).map(([field, value]) => ({
        field,
        value,
      })),
    }

    try {
      // Call parent onSubmit
      const result = await onSubmit(submissionData)

      if (result.success) {
        setIsSubmitted(true)

        // Handle redirect
        if (form.redirect?.url) {
          // Small delay to allow user to see the submission happened
          setTimeout(() => {
            window.location.href = form.redirect!.url
          }, 300)
        }
      } else if (result.error) {
        // Set form-level error
        if (result.error.message) {
          setFormError(result.error.message)
        }

        // Map API errors to fields
        if (result.error.errors) {
          const errors: Record<string, string> = {}
          result.error.errors.forEach((err) => {
            errors[err.field] = err.message
          })
          setApiErrors(errors)
        }
      }
    } catch (error) {
      // Handle unexpected errors
      setFormError('An unexpected error occurred. Please try again.')
      console.error('Form submission error:', error)
    }
  }

  // Show confirmation message if submitted and no redirect
  if (isSubmitted && !form.redirect) {
    return (
      <div
        className={`p-6 sm:p-8 bg-teal-50 rounded-lg text-center ${className}`}
        role="status"
        aria-live="polite"
      >
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Thank You!
        </h3>
        <p className="text-sm sm:text-base text-gray-700">
          {form.confirmationMessage || 'Your form has been submitted successfully.'}
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {form.title && (
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 sm:mb-8">
          {form.title}
        </h2>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Form-level error message */}
        {formError && (
          <div
            className="mb-6 p-4 bg-error/10 border border-error rounded text-error text-sm"
            role="alert"
            aria-live="assertive"
          >
            {formError}
          </div>
        )}

        {/* Render form fields */}
        <div className="flex flex-col gap-6">
          {form.fields.map((field) => {
            // Get error message from either react-hook-form validation or API errors
            const fieldError =
              (errors[field.name]?.message as string) || apiErrors[field.name]

            // For checkbox fields, render without FormField wrapper
            if (field.blockType === 'checkbox') {
              return (
                <div key={field.name} className={field.width || 'w-full'}>
                  {renderField(field, register, fieldError)}
                  {fieldError && (
                    <p className="mt-1 text-sm text-error" role="alert">
                      {fieldError}
                    </p>
                  )}
                </div>
              )
            }

            // For message fields, render without FormField wrapper
            if (field.blockType === 'message') {
              return (
                <div key={field.name} className={field.width || 'w-full'}>
                  {renderField(field, register)}
                </div>
              )
            }

            // For all other fields, wrap in FormField
            return (
              <div key={field.name} className={field.width || 'w-full'}>
                <FormField
                  id={field.name}
                  label={field.label}
                  required={field.required}
                  error={fieldError}
                  disabled={isSubmitting}
                >
                  {renderField(field, register, fieldError)}
                </FormField>
              </div>
            )
          })}
        </div>

        {/* Submit button */}
        <div className="mt-8">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
          >
            {form.submitButtonLabel || 'Submit'}
          </Button>
        </div>

        {/* Screen reader announcement for loading state */}
        {isSubmitting && (
          <div className="sr-only" role="status" aria-live="assertive">
            Submitting form, please wait...
          </div>
        )}
      </form>
    </div>
  )
}
