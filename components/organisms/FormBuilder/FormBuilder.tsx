import { useState, type ReactNode } from 'react'
import { useForm, UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodObject, ZodRawShape } from 'zod'
import { Input } from '../../atoms/form/Input'
import { Textarea } from '../../atoms/form/Textarea'
import { Select } from '../../atoms/form/Select'
import { Checkbox } from '../../atoms/form/Checkbox'
import { Button } from '../../atoms/Button'
import { FormField } from '../../molecules/FormField'
import { useT } from '../../../hooks/useT'
import type { TFunction } from '../../../lib/i18n'

/** PayloadCMS Form Builder field configuration */
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

  /**
   * How much of the row this field takes, as a percentage from 1 to 100. It
   * is the plugin's own unit, and the editor's: a 50 beside a 50 is a
   * two-column pair. See {@link fieldSpanClass} for how it is rendered, and
   * why it is not a class name.
   */
  width?: number

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

/** PayloadCMS Form Builder configuration */
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

  /**
   * Where to send the visitor after a successful submission, instead of
   * showing the confirmation message.
   *
   * ⚠ **The caller owns the scheme.** This is assigned to
   * `window.location.href`, so a `javascript:` URL would run in this origin.
   * A URL the caller did not author itself must pass `isSafeNavigationUrl`
   * (`lib/urls.ts`) before it arrives here — see `cmsFormConfig`, which gates
   * the CMS's authored value.
   */
  redirect?: {
    url: string
  }
}

/** Form submission data structure expected by PayloadCMS */
export interface FormBuilderSubmission {
  form: string
  submissionData: Array<{
    field: string
    value: string | boolean | number
  }>
}

/** API error response with field-level errors */
export interface FormBuilderApiError {
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}

/** FormBuilder organism component props */
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
   * Visual variant for the form
   * - default: Standard form with labels and borders
   * - minimal: Minimal form with placeholders and minimal styling
   * @default 'default'
   */
  variant?: 'default' | 'minimal'

  /**
   * Form alignment
   * - left: Left-aligned title and button (fields always left-aligned)
   * - center: Centered title and button (fields always left-aligned)
   * @default 'left'
   */
  align?: 'left' | 'center'

  /** Additional CSS classes for the form wrapper */
  className?: string

  /**
   * Optional Zod schema for form validation. When set, the form uses
   * zodResolver for type-safe validation. Otherwise it falls back to
   * react-hook-form's built-in validation.
   *
   * @example
   * import { z } from 'zod'
   * const schema = z.object({
   *   email: z.string().email('Invalid email'),
   *   name: z.string().min(1, 'Name is required'),
   * })
   * <FormBuilder form={formConfig} onSubmit={handleSubmit} schema={schema} />
   */
  schema?: ZodObject<ZodRawShape>

  /**
   * Rendered inside the `<form>`, between the fields and the submit button.
   * The slot a captcha goes in — see `CmsForm`, which puts Turnstile here.
   * Kept as a slot so this component stays free of any one provider.
   */
  captcha?: ReactNode
}

/**
 * The authored percentage width, as a column span in the fields grid.
 *
 * ⚠ **Every class is written out, and that is the point.** Tailwind scans
 * source text, so an interpolated `sm:col-span-${n}` or `w-[${width}%]`
 * produces no CSS at all and the field silently renders full width. Twelve
 * literals cannot be missed by the scanner, and they keep the editor's
 * fidelity where a handful of buckets would round a 40 and a 60 to the same
 * thing.
 *
 * Mobile-first: the grid is one column below `sm`, so the span applies only
 * once there is room for it.
 */
const FIELD_SPAN_CLASS = [
  'sm:col-span-1',
  'sm:col-span-2',
  'sm:col-span-3',
  'sm:col-span-4',
  'sm:col-span-5',
  'sm:col-span-6',
  'sm:col-span-7',
  'sm:col-span-8',
  'sm:col-span-9',
  'sm:col-span-10',
  'sm:col-span-11',
  'sm:col-span-12',
] as const

const FIELD_GRID_COLUMNS = FIELD_SPAN_CLASS.length

function fieldSpanClass(width?: number): string {
  if (width == null || !Number.isFinite(width)) {
    return FIELD_SPAN_CLASS[FIELD_GRID_COLUMNS - 1]
  }
  const span = Math.round((width / 100) * FIELD_GRID_COLUMNS)

  return FIELD_SPAN_CLASS[Math.min(FIELD_GRID_COLUMNS, Math.max(1, span)) - 1]
}

/** Renders a form field based on its type */
function renderField(
  field: FormBuilderField,
  register: UseFormRegister<any>,
  variant: 'default' | 'minimal',
  // A plain function, not a component, so the accessor is passed in
  // rather than read from a hook.
  t: TFunction,
  fieldError?: string
) {
  // Filter defaultValue to allow only a string or number for non-checkbox fields
  const getDefaultValue = () => {
    if (field.blockType === 'checkbox') return undefined
    if (typeof field.defaultValue === 'boolean') return undefined
    return field.defaultValue
  }

  // Determine state based on error
  const state = fieldError ? 'error' : 'default'

  const commonProps = {
    id: field.name,
    placeholder: variant === 'minimal' ? field.label : field.placeholder,
    defaultValue: getDefaultValue(),
    variant: variant,
    state: state as 'default' | 'error',
    'aria-invalid': !!fieldError,
    ...register(field.name, {
      required: field.required
        ? t('forms.general.field_required', { field: field.label })
        : false,
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
        <Select
          {...commonProps}
          placeholder={
            variant === 'minimal'
              ? field.label
              : field.placeholder || t('forms.general.select_placeholder')
          }
          fullWidth
        >
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
          hasError={!!fieldError}
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
 * FormBuilder is an organism that dynamically renders forms from the
 * PayloadCMS form builder plugin.
 *
 * It supports all standard field types (text, textarea, select, email,
 * checkbox, number, message), and it handles form submission, validation,
 * confirmation messages, and redirects.
 *
 * Submission is the caller's: this component formats the answers and reports
 * the outcome. `CmsForm` is the wiring for an authored CMS form, including the
 * captcha and the intake's error codes.
 *
 * @example
 * <FormBuilder
 *   form={formConfig}
 *   onSubmit={async (data) => {
 *     const response = await fetch('/api/submissions', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     })
 *     return { success: response.ok }
 *   }}
 * />
 */
export function FormBuilder({
  form,
  onSubmit,
  variant = 'default',
  align = 'left',
  className = '',
  schema,
  captcha,
}: FormBuilderProps) {
  const t = useT()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    resolver: schema ? zodResolver(schema) : undefined,
  })

  /** Handle form submission */
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
      setFormError(t('forms.general.submit_error'))
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
          {t('forms.general.thank_you')}
        </h3>
        <p className="text-sm sm:text-base text-gray-700">
          {form.confirmationMessage || t('forms.general.submitted')}
        </p>
      </div>
    )
  }

  // The captcha slot and the submit button share the title's alignment. The
  // fields never centre: a centred label column is unreadable.
  const rowAlign = align === 'center' ? 'flex justify-center' : ''

  return (
    <div className={className}>
      {form.title && (
        <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8 ${align === 'center' ? 'text-center' : 'text-left'}`}>
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

        {/* Render form fields. One column below `sm`, twelve above, so an
            authored width can place two fields side by side. */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
          {form.fields.map((field) => {
            // Get error message from either react-hook-form validation or API errors
            const fieldError =
              (errors[field.name]?.message as string) || apiErrors[field.name]

            // For checkbox fields, render without FormField wrapper
            if (field.blockType === 'checkbox') {
              return (
                <div key={field.name} className={fieldSpanClass(field.width)}>
                  {renderField(field, register, variant, t, fieldError)}
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
                <div key={field.name} className={fieldSpanClass(field.width)}>
                  {renderField(field, register, variant, t)}
                </div>
              )
            }

            // For minimal variant, render without FormField wrapper. It uses placeholders instead.
            if (variant === 'minimal') {
              return (
                <div key={field.name} className={fieldSpanClass(field.width)}>
                  {renderField(field, register, variant, t, fieldError)}
                  {fieldError && (
                    <p className="mt-1 text-sm text-error" role="alert">
                      {fieldError}
                    </p>
                  )}
                </div>
              )
            }

            // For default variant, wrap in FormField
            return (
              <div key={field.name} className={fieldSpanClass(field.width)}>
                <FormField
                  id={field.name}
                  label={field.label}
                  required={field.required}
                  error={fieldError}
                  disabled={isSubmitting}
                >
                  {renderField(field, register, variant, t, fieldError)}
                </FormField>
              </div>
            )
          })}
        </div>

        {captcha && (
          <div className={`mt-6 ${rowAlign}`}>{captcha}</div>
        )}

        {/* Submit button */}
        <div className={`mt-8 ${rowAlign}`}>
          <Button
            type="submit"
            variant={variant === 'minimal' ? 'outline' : 'primary'}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="min-w-32"
          >
            {form.submitButtonLabel || t('forms.general.submit')}
          </Button>
        </div>

        {/* Screen reader announcement for loading state */}
        {isSubmitting && (
          <div className="sr-only" role="status" aria-live="assertive">
            {t('forms.a11y.submitting')}
          </div>
        )}
      </form>
    </div>
  )
}
