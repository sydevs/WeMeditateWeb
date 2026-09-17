# FormBuilder

Renders a form from PayloadCMS's `@payloadcms/plugin-form-builder` data structure. A content
editor builds the form in the PayloadCMS admin. This component then renders it on the frontend,
using our atom components — no developer change needed per form.

## Features

- Renders every field type the plugin supports: text, email, number, textarea, select, checkbox,
  and message (display-only text).
- Validates with native HTML5 validation, plus server-side error display.
- Handles submission through a caller-supplied callback, with a loading state.
- Displays a confirmation message, or redirects, after a successful submission.
- Meets WCAG 2.1 Level AA, with the right ARIA attributes.
- Uses `react-hook-form` (^7.53.2) for form state.

## Supported field types

| Field type | Component | Description |
| --- | --- | --- |
| `text` | Input | Single-line text |
| `email` | Input | Email, with validation |
| `number` | Input | Numeric input |
| `textarea` | Textarea | Multi-line text |
| `select` | Select | Dropdown |
| `checkbox` | Checkbox | Boolean |
| `message` | Text | Display-only text, no input |

## Usage

**For a CMS form, use [`CmsForm`](../CmsForm/CmsForm.tsx) instead.** It is the wiring for an
authored `forms` document: the field mapping, the Turnstile captcha, and the submit to the
unified intake. This component is the renderer underneath it, and takes any form.

```tsx
import { FormBuilder } from '..'

async function handleSubmit(data) {
  const response = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body(data)),
  })
  if (response.ok) return { success: true }
  return { success: false, error: { message: t('forms.general.submit_error') } }
}

<FormBuilder form={formConfig} onSubmit={handleSubmit} />
```

Pass `className` to style the form wrapper. Pass `form.redirect.url` to redirect after a
successful submission instead of displaying the confirmation message.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `form` | `FormBuilderConfig` | Yes | The form configuration from PayloadCMS. |
| `onSubmit` | `(data: FormBuilderSubmission) => Promise<{ success: boolean; error?: {...} }>` | Yes | Handles the submission. Returns success or an error. |
| `variant` | `'default' \| 'minimal'` | No | `default` displays labels and borders with the primary button. `minimal` displays placeholders instead of labels, with the outline button. |
| `align` | `'left' \| 'center'` | No | Aligns the title and submit button. Fields stay left-aligned either way. Defaults to `left`. |
| `className` | `string` | No | Extra classes for the form wrapper. |
| `schema` | `ZodObject` | No | Validates with `zodResolver` instead of react-hook-form's own rules. |
| `captcha` | `ReactNode` | No | Rendered between the fields and the submit button. Kept a slot so this component knows no captcha provider. |

```typescript
interface FormBuilderConfig {
  id: string
  title?: string
  fields: FormBuilderField[]
  submitButtonLabel?: string
  confirmationMessage?: string
  redirect?: { url: string }
}
```

**Submission data** sent to `onSubmit`:
```typescript
{
  form: "form-id",
  submissionData: [{ field: "name", value: "John Doe" }, ...]
}
```

## Field configuration

```typescript
interface FormBuilderField {
  name: string                    // Unique field id
  blockType: FieldType            // text, email, select, ...
  label: string
  required?: boolean
  defaultValue?: string | boolean
  width?: number                  // Percentage of the row, 1–100. The plugin's own unit.
  placeholder?: string
  options?: Array<{ label: string; value: string }>  // Required for select
  message?: string                // Required for message fields
}
```

A CMS form needs no separate read: an embedded `forms` relationship is populated by the page read
(`EMBEDDED_FORM_SELECT` in `server/cms-client.ts`), and `cmsFormSpec` in `lib/cms-forms.ts` turns
that document into a `FormBuilderConfig`.

## Field width

The fields sit in a 12-column grid, single-column below the `sm` breakpoint. A field's `width` is
a percentage, rounded to the nearest column span, so a 50 beside a 50 is a two-column pair from
`sm` up and two stacked full-width fields on a phone.

⚠ The span classes are written out one per column in `FormBuilder.tsx`, and must stay that way.
Tailwind scans source text, so an interpolated `sm:col-span-${n}` or `w-[${width}%]` produces no
CSS at all and the field silently renders full width.

## Validation

Native HTML5 attributes (`required`, `type="email"`, `type="number"`) validate on the client. The
API can return field-level errors, shown next to the matching field:

```typescript
{
  success: false,
  error: {
    message: 'Please correct the errors below',
    errors: [{ field: 'email', message: 'Email already registered' }],
  }
}
```

## Confirmation and redirect

Without `form.redirect`, a successful submission replaces the form with
`form.confirmationMessage`. With `form.redirect.url` set, FormBuilder redirects the user there
instead.

⚠ **The caller owns the scheme.** The URL is assigned to `window.location.href`, so a
`javascript:` value would execute in this origin. Any URL the caller did not author itself must
pass `isSafeNavigationUrl` (`lib/urls.ts`) first — `cmsFormConfig` does this for the CMS's
authored value, and drops the redirect when it fails.

## Authoring a CMS form: name the name field `name`

⚠ **Call the sender's name field exactly `name`.** The intake creates a `users` row for each
sender, and it takes that row's name from the submission pair keyed `name` — matched on the key,
not on a block type, because the plugin has no name block. A field called `fullName` or
`your-name` gets the address's local part instead (`jo.smith@…` → "jo smith"), and the row is
written on first contact and reused after, so a later correction does not reach it.

The email field is matched on its block type, so that one can be called anything.

## Accessibility

Uses `<form>` and `<label>` with a correct heading hierarchy. Sets `aria-invalid`,
`aria-describedby`, and an `aria-live` region for validation and submission status, so a screen
reader announces both. Every interactive element is keyboard-accessible.

## Notes

- The component is data-driven. A new form needs no code change.
- Field labels and error messages come from PayloadCMS, already localized.
- The caller fetches the form configuration and handles the actual API submission — this
  component only renders and validates.

## Related components

- [Input](../../atoms/form/Input/Input.tsx), [Textarea](../../atoms/form/Textarea/Textarea.tsx),
  [Select](../../atoms/form/Select/Select.tsx), [Checkbox](../../atoms/form/Checkbox/Checkbox.tsx)
- [Button](../../atoms/Button/Button.tsx) — the submit button
- [FormField](../../molecules/FormField/FormField.tsx) — the field wrapper molecule

See [FormBuilder.stories.tsx](FormBuilder.stories.tsx) for full examples: a contact form, a
registration form with every field type, a newsletter signup, and a form displaying validation
errors.
