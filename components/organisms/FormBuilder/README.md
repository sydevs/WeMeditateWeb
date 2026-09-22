# FormBuilder

Renders a form from PayloadCMS's `@payloadcms/plugin-form-builder` data structure. A content
editor builds the form in the PayloadCMS admin. This component then renders it on the frontend,
using our atom components — no developer change needed per form.

## Features

- Renders every field type the plugin supports: text, email, number, textarea, select, checkbox,
  and message (display-only text).
- Validates with native HTML5 validation, plus server-side error display.
- Submits to the unified `user-submissions` intake through the same-origin proxy, behind a
  Cloudflare Turnstile challenge, with a loading state.
- Displays a confirmation message, or redirects, after a successful submission.
- Meets WCAG 2.1 Level AA, with the right ARIA attributes.
- Uses `react-hook-form` (^7.53.2) for form state, and `@marsidev/react-turnstile` for the
  captcha. Both server-render: the fields arrive in the HTML, the challenge on hydration.

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

It takes the authored `forms` document itself, so there is no second shape to keep in step. The
RichText `relationship` converter renders it for a `forms` node embedded in page content, and
nothing else needs to call it.

```tsx
import { FormBuilder } from './FormBuilder'

<FormBuilder form={page.form} className="my-8" />
```

⚠ **It server-renders, and that is a priced decision.** `RichText` renders on every page, so
`react-hook-form` and `@marsidev/react-turnstile` are in every route's chunk and in `dist/server`
(2.53 MB → 2.63 MB). Server-rendered fields were judged worth that. Do not reclaim it by moving
the component behind `ClientOnly` and `React.lazy`.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `form` | `EmbeddedForm` | Yes | The authored `forms` document, populated by the page read. |
| `siteKey` | `string` | No | The Turnstile **site** key. Defaults to `PUBLIC__TURNSTILE_SITE_KEY`. Unset, no captcha renders and SahajCloud refuses the submission. |
| `variant` | `'default' \| 'minimal'` | No | `default` displays labels and borders with the primary button. `minimal` displays placeholders instead of labels, with the outline button. |
| `align` | `'left' \| 'center'` | No | Aligns the title and submit button. Fields stay left-aligned either way. Defaults to `left`. |
| `className` | `string` | No | Extra classes for the form wrapper. |

A form with no fields renders nothing, the way every other embedded document degrades.

## The wire contract

`lib/submissions.ts` turns the document plus the answers into the `user-submissions` create body,
and owns every decision about it. An embedded `forms` relationship needs no separate read: the
page read populates it through `EMBEDDED_FORM_SELECT` in `server/sahajcloud-client.ts`.

⚠ **An author must call the sender's name field exactly `name`.** `prepareUserSubmission`
upstream matches it on that literal key, not on a block type, and the `users` row is written on
first contact and never revisited — so a field called `fullName` names that row off the email's
local part, permanently.

## Field configuration

Fields are the plugin's own blocks, typed as `EmbeddedForm['fields']` — there is no parallel
interface here. `country` and `state` render as text inputs: the plugin picks them from bundled
option lists this repo does not mirror and the read does not return, and a typed answer still
submits the pair the collection expects.

## Field width

The fields sit in a 12-column grid, single-column below the `sm` breakpoint. A field's `width` is
a percentage, rounded to the nearest column span, so a 50 beside a 50 is a two-column pair from
`sm` up and two stacked full-width fields on a phone.

⚠ The span class is interpolated, so Tailwind's scanner never sees it.
`@source inline("sm:col-span-{1..12}")` in `layouts/tailwind.css` is what emits the CSS; without
that line every field silently renders full width.

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

⚠ **The authored URL is untrusted.** It is assigned to `window.location.href`, so a
`javascript:` value would execute in this origin. FormBuilder passes it through
`isSafeNavigationUrl` (`lib/urls.ts`) and drops the redirect when it fails.

## Authoring a form: name the name field `name`

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
