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

```tsx
import { FormBuilder } from '..'

async function handleSubmit(data) {
  const response = await fetch('/api/form-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (response.ok) return { success: true }
  return { success: false, error: await response.json() }
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
  width?: string                  // Any CSS width class, for example 'w-full', 'w-1/2'
  placeholder?: string
  options?: Array<{ label: string; value: string }>  // Required for select
  message?: string                // Required for message fields
}
```

Fetch `formConfig` in the page's `+data.ts` with `getFormById({ id, locale, apiKey, kv })`.

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
