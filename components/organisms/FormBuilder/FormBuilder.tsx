import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { Input } from '../../atoms/form/Input'
import { Textarea } from '../../atoms/form/Textarea'
import { Select } from '../../atoms/form/Select'
import { Checkbox } from '../../atoms/form/Checkbox'
import { Button } from '../../atoms/Button'
import { FormField } from '../../molecules/FormField'
import { RichText } from '../RichText/RichText'
import { useT } from '../../../hooks/useT'
import { useLocale, useOptionalPageContext } from '../../../hooks/usePageContext'
import {
  submissionBody,
  SUBMISSION_PATH,
  TURNSTILE_TOKEN_HEADER,
} from '../../../lib/submissions'
import { isSafeNavigationUrl, normalizeContentPath } from '../../../lib/urls'
import type { TFunction } from '../../../lib/i18n'
import type { EmbeddedForm } from '../../../server/content-types'

/** One entry of the plugin's authored field list. */
type AuthoredField = NonNullable<EmbeddedForm['fields']>[number]

export interface FormBuilderProps {
  /** The authored `forms` document, populated by the page read. */
  form: EmbeddedForm

  /**
   * The Turnstile **site** key. Unset, no captcha renders and the CMS refuses
   * the submission — which is the honest outcome of an unconfigured site.
   * @default import.meta.env.PUBLIC__TURNSTILE_SITE_KEY
   */
  siteKey?: string

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
}

const FIELD_GRID_COLUMNS = 12

/**
 * The authored percentage width, as a column span in the fields grid.
 *
 * ⚠ **The class is interpolated, so the scanner never sees it.**
 * `@source inline("sm:col-span-{1..12}")` in `layouts/tailwind.css` is what
 * emits the CSS; without that line every field silently renders full width.
 *
 * Mobile-first: the grid is one column below `sm`, so the span applies only
 * once there is room for it.
 */
function fieldSpanClass(width?: number | null): string {
  if (width == null || !Number.isFinite(width)) {
    return `sm:col-span-${FIELD_GRID_COLUMNS}`
  }
  const span = Math.round((width / 100) * FIELD_GRID_COLUMNS)

  return `sm:col-span-${Math.min(FIELD_GRID_COLUMNS, Math.max(1, span))}`
}

/**
 * The input type for an authored block.
 *
 * `country` and `state` render as text inputs. The plugin picks them from its
 * own bundled option lists, which this repo does not mirror and the API read
 * does not return; a typed answer still submits the pair the collection
 * expects, where rendering nothing would drop a required field and fail the
 * submission server-side.
 */
function inputTypeOf(blockType: AuthoredField['blockType']): string {
  switch (blockType) {
    case 'country':
    case 'state':
      return 'text'
    default:
      return blockType
  }
}

/** Renders one authored field. */
function renderField(
  field: AuthoredField,
  register: UseFormRegister<Record<string, unknown>>,
  variant: 'default' | 'minimal',
  // A plain function, not a component, so the accessor is passed in
  // rather than read from a hook.
  t: TFunction,
  fieldError?: string
) {
  if (field.blockType === 'message') {
    return <RichText className="text-sm sm:text-base text-gray-600 leading-relaxed" content={field.message} />
  }

  const label = field.label ?? field.name
  const options = 'options' in field ? field.options : null
  const placeholder = 'placeholder' in field ? field.placeholder : null
  const defaultValue = 'defaultValue' in field ? field.defaultValue : null

  if (field.blockType === 'checkbox') {
    return (
      <Checkbox
        {...register(field.name)}
        id={field.name}
        label={label}
        defaultChecked={defaultValue === true}
        hasError={!!fieldError}
        aria-invalid={!!fieldError}
      />
    )
  }

  const commonProps = {
    id: field.name,
    placeholder: (variant === 'minimal' ? label : placeholder) ?? undefined,
    defaultValue: typeof defaultValue === 'boolean' ? undefined : (defaultValue ?? undefined),
    variant,
    state: (fieldError ? 'error' : 'default') as 'default' | 'error',
    'aria-invalid': !!fieldError,
    ...register(field.name, {
      required: field.required ? t('forms.general.field_required', { field: label }) : false,
    }),
  }

  switch (field.blockType) {
    case 'textarea':
      return <Textarea {...commonProps} rows={4} />

    case 'number':
      return <Input {...commonProps} type="number" step="any" />

    case 'select':
      return (
        <Select
          {...commonProps}
          placeholder={
            variant === 'minimal'
              ? label
              : placeholder || t('forms.general.select_placeholder')
          }
          fullWidth
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )

    default:
      return <Input {...commonProps} type={inputTypeOf(field.blockType)} />
  }
}

/**
 * Renders an authored form and submits it to the unified intake.
 *
 * It takes the `forms` document the page read returns, so there is no second
 * shape to keep in step: the plugin's field list, its localized labels, its
 * percentage widths and its Lexical blocks all render from the document
 * itself. The RichText `relationship` converter renders this for a `forms`
 * node embedded in page content.
 *
 * **Every refusal shows one message, and re-challenges.** The intake
 * distinguishes a failed captcha from a disposable address from a key the form
 * never declared, but this site has one CMS-owned string for a failed send
 * (`forms.general.submit_error`) and a translation cannot be invented here —
 * the keys come from the CMS schema. Re-challenging regardless is deliberate
 * too: see `SubmissionResult` in `lib/submissions.ts`.
 *
 * ⚠ **This server-renders, and its libraries are in the Worker on purpose.**
 * `RichText` renders on every page, so `react-hook-form` and
 * `@marsidev/react-turnstile` reach every route's chunk and `dist/server`
 * (2.53 MB → 2.63 MB, measured). Fields that a crawler and a reader on a slow
 * connection both get were judged worth that, so do not put this back behind
 * `ClientOnly` and `React.lazy` to reclaim it.
 */
export function FormBuilder({
  form,
  siteKey = import.meta.env.PUBLIC__TURNSTILE_SITE_KEY,
  variant = 'default',
  align = 'left',
  className = '',
}: FormBuilderProps) {
  const t = useT()
  const locale = useLocale()
  // The page this form sits on, from the same object the locale comes from, so
  // the two `submissionData` pairs cannot disagree. Spelled the way every
  // other consumer spells a path — `urlPathname` still carries
  // `+onBeforeRoute`'s `/index` for the home page.
  const path = normalizeContentPath(useOptionalPageContext()?.urlPathname)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  // Bumped on every refusal, and used as the widget's key: a Turnstile token
  // is single-use, so a second attempt needs a fresh widget rather than the
  // spent token the first attempt sent.
  const [attempt, setAttempt] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onSubmit' })

  const fields = form.fields ?? []

  // ⚠ The scheme is checked here, and nowhere else on the path. The URL is
  // assigned to `window.location.href`, so an authored `javascript:` value
  // would run in our origin on every successful submission.
  // `forms.redirect.url` is a plain CMS text field with no upstream
  // validation. A refused URL simply leaves the form showing its confirmation
  // message instead.
  const redirectUrl = form.confirmationType === 'redirect' ? form.redirect?.url : undefined
  const redirect = redirectUrl && isSafeNavigationUrl(redirectUrl) ? redirectUrl : undefined

  /** Every failure looks the same to the visitor, and costs a fresh challenge. */
  const refuse = () => {
    setToken(null)
    setAttempt((previous) => previous + 1)
    setFormError(t('forms.general.submit_error'))
  }

  const onSubmit = async (answers: Record<string, string | boolean | number>) => {
    setFormError('')

    let response: Response

    try {
      response = await fetch(SUBMISSION_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { [TURNSTILE_TOKEN_HEADER]: token } : {}),
        },
        body: JSON.stringify(submissionBody({ form, answers, locale, path })),
      })
    } catch {
      // A dropped connection may still have reached the CMS and spent the
      // token, so this re-challenges like any other failure.
      return refuse()
    }

    if (!response.ok) return refuse()

    setIsSubmitted(true)

    if (redirect) {
      // Small delay to allow user to see the submission happened
      setTimeout(() => {
        window.location.href = redirect
      }, 300)
    }
  }

  // A form with no fields renders nothing, the way every other embedded
  // document degrades rather than showing an empty shell.
  if (fields.length === 0) return null

  if (isSubmitted && !redirect) {
    return (
      <div
        className={`p-6 sm:p-8 bg-teal-50 rounded-lg text-center ${className}`}
        role="status"
        aria-live="polite"
      >
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {t('forms.general.thank_you')}
        </h3>
        {form.confirmationMessage ? (
          <RichText className="text-sm sm:text-base text-gray-700" content={form.confirmationMessage} />
        ) : (
          <p className="text-sm sm:text-base text-gray-700">{t('forms.general.submitted')}</p>
        )}
      </div>
    )
  }

  // The captcha and the submit button share the title's alignment. The fields
  // never centre: a centred label column is unreadable.
  const rowAlign = align === 'center' ? 'flex justify-center' : ''

  return (
    <div className={className}>
      {form.title && (
        <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8 ${align === 'center' ? 'text-center' : 'text-left'}`}>
          {form.title}
        </h2>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div
            className="mb-6 p-4 bg-error/10 border border-error rounded text-error text-sm"
            role="alert"
            aria-live="assertive"
          >
            {formError}
          </div>
        )}

        {/* One column below `sm`, twelve above, so an authored width can place
            two fields side by side. */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
          {fields.map((field) => {
            // A message block carries no `name`, so the list key falls back to
            // the block's own id.
            const key = field.blockType === 'message' ? (field.id ?? 'message') : field.name
            const fieldError =
              field.blockType === 'message'
                ? undefined
                : (errors[field.name]?.message as string | undefined)
            const span = fieldSpanClass('width' in field ? field.width : null)

            if (field.blockType === 'message') {
              return (
                <div key={key} className={span}>
                  {renderField(field, register, variant, t)}
                </div>
              )
            }

            // Checkbox carries its own label, and the minimal variant uses
            // placeholders, so neither wants the FormField wrapper.
            if (field.blockType === 'checkbox' || variant === 'minimal') {
              return (
                <div key={key} className={span}>
                  {renderField(field, register, variant, t, fieldError)}
                  {fieldError && (
                    <p className="mt-1 text-sm text-error" role="alert">
                      {fieldError}
                    </p>
                  )}
                </div>
              )
            }

            return (
              <div key={key} className={span}>
                <FormField
                  id={field.name}
                  label={field.label ?? field.name}
                  required={field.required ?? undefined}
                  error={fieldError}
                  disabled={isSubmitting}
                >
                  {renderField(field, register, variant, t, fieldError)}
                </FormField>
              </div>
            )
          })}
        </div>

        {siteKey && (
          <div className={`mt-6 ${rowAlign}`}>
            <Turnstile
              key={attempt}
              siteKey={siteKey}
              onSuccess={setToken}
              // A failed, expired or unreachable challenge all leave the form
              // without a token. The CMS refuses that submission, which is the
              // same outcome as an unsolved challenge — nothing to recover.
              onError={() => setToken(null)}
              onExpire={() => setToken(null)}
              // ⚠ `execution: 'render'` is what survives a client-side
              // navigation. Cloudflare's automatic scan runs once per document
              // load, and Vike swaps the page under `<main>` without reloading,
              // so a scanned widget would appear on a full load and never
              // again. This ties the challenge to this component's lifecycle.
              //
              // Cloudflare's own language default follows the *browser*, so a
              // visitor reading the Spanish site in an English browser would
              // get an English challenge mid-form. Pass the page locale.
              options={{ execution: 'render', theme: 'light', language: locale }}
            />
          </div>
        )}

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

        {isSubmitting && (
          <div className="sr-only" role="status" aria-live="assertive">
            {t('forms.a11y.submitting')}
          </div>
        )}
      </form>
    </div>
  )
}
