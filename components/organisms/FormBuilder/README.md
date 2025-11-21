# FormBuilder

Dynamic form rendering component that constructs forms from PayloadCMS's `@payloadcms/plugin-form-builder` plugin data structure.

## Purpose

Enables content editors to create custom forms through the PayloadCMS admin interface without requiring developer intervention. The FormBuilder component consumes form configuration data and renders functional, accessible forms on the frontend using our existing atom components.

## Features

- ✅ **Dynamic Field Rendering** - Automatically renders form fields based on PayloadCMS configuration
- ✅ **All Field Types** - Supports text, email, number, textarea, select, checkbox, and message fields
- ✅ **Form Validation** - Native HTML5 validation + server-side error display
- ✅ **Submission Handling** - Flexible submission callback with loading states
- ✅ **Confirmation Messages** - Shows success message or redirects after submission
- ✅ **Accessible** - WCAG 2.1 Level AA compliant with ARIA attributes
- ✅ **Responsive** - Mobile-first design that works on all screen sizes
- ✅ **Type-Safe** - Full TypeScript support with comprehensive interfaces

## Supported Field Types

| Field Type | Component | Description |
|------------|-----------|-------------|
| `text` | Input | Single-line text input |
| `email` | Input | Email input with validation |
| `number` | Input | Numeric input |
| `textarea` | Textarea | Multi-line text input |
| `select` | Select | Dropdown selection |
| `checkbox` | Checkbox | Boolean checkbox |
| `message` | Text | Display-only informational text (no input) |

## Usage

### Basic Usage

```tsx
import { FormBuilder } from '@/components/organisms'

function ContactPage({ formConfig }) {
  const handleSubmit = async (data) => {
    const response = await fetch('/api/form-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const error = await response.json()
      return { success: false, error }
    }
  }

  return <FormBuilder form={formConfig} onSubmit={handleSubmit} />
}
```

### With Custom Styling

```tsx
<FormBuilder
  form={formConfig}
  onSubmit={handleSubmit}
  className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow"
/>
```

### With Redirect After Submission

```tsx
const formConfig = {
  id: 'contact-form',
  fields: [/* ... */],
  submitButtonLabel: 'Send Message',
  redirect: {
    url: '/thank-you'
  }
}

<FormBuilder form={formConfig} onSubmit={handleSubmit} />
```

## Props

### `form: FormBuilderConfig` (required)

Form configuration object from PayloadCMS.

```typescript
interface FormBuilderConfig {
  id: string
  title?: string
  fields: FormBuilderField[]
  submitButtonLabel?: string
  confirmationMessage?: string
  redirect?: {
    url: string
  }
}
```

### `onSubmit: (data: FormBuilderSubmission) => Promise<...>` (required)

Callback function that handles form submission. Must return a promise with success status and optional error.

**Submission Data Structure:**
```typescript
{
  form: "form-id",
  submissionData: [
    { field: "name", value: "John Doe" },
    { field: "email", value: "john@example.com" }
  ]
}
```

**Return Value:**
```typescript
{
  success: boolean
  error?: {
    message: string
    errors?: Array<{
      field: string
      message: string
    }>
  }
}
```

### `className?: string` (optional)

Additional CSS classes for the form wrapper.

## Field Configuration

Each field in the `fields` array supports these properties:

```typescript
interface FormBuilderField {
  name: string                    // Required: Unique field identifier
  blockType: FieldType            // Required: Field type (text, email, etc.)
  label: string                   // Required: Field label
  required?: boolean              // Optional: Whether field is required
  defaultValue?: string | boolean // Optional: Default value
  width?: string                  // Optional: CSS width class
  placeholder?: string            // Optional: Placeholder text
  options?: Array<{              // Required for select fields
    label: string
    value: string
  }>
  message?: string                // Required for message fields
}
```

## PayloadCMS Integration

### Form Configuration Example

```typescript
const contactForm = {
  id: 'contact-form',
  title: 'Contact Us',
  fields: [
    {
      name: 'name',
      blockType: 'text',
      label: 'Full Name',
      required: true,
      placeholder: 'John Doe'
    },
    {
      name: 'email',
      blockType: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'your@email.com'
    },
    {
      name: 'subject',
      blockType: 'select',
      label: 'Subject',
      required: true,
      options: [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Technical Support', value: 'support' }
      ]
    },
    {
      name: 'message',
      blockType: 'textarea',
      label: 'Message',
      required: true,
      placeholder: 'Tell us how we can help...'
    },
    {
      name: 'newsletter',
      blockType: 'checkbox',
      label: 'Subscribe to our newsletter'
    }
  ],
  submitButtonLabel: 'Send Message',
  confirmationMessage: "Thank you! We'll get back to you soon."
}
```

### Fetching Form Data

Form configurations should be fetched as part of your page data in Vike's `+data.ts`:

```typescript
// pages/contact/+data.ts
export async function data(pageContext) {
  const formConfig = await getFormById({
    id: 'contact-form',
    locale: pageContext.locale,
    apiKey: process.env.PAYLOAD_API_KEY,
    kv: pageContext.cloudflare.env.WEMEDITATE_CACHE
  })

  return { formConfig }
}
```

## Validation

### Client-Side Validation

Uses native HTML5 validation:
- `required` attribute for required fields
- `type="email"` for email validation
- `type="number"` for numeric validation

Validation errors are displayed in real-time as users submit the form.

### Server-Side Validation

API can return field-level errors that are displayed next to the corresponding fields:

```typescript
return {
  success: false,
  error: {
    message: 'Please correct the errors below',
    errors: [
      { field: 'email', message: 'Email already registered' },
      { field: 'message', message: 'Message too short' }
    ]
  }
}
```

## Confirmation & Redirect

### Confirmation Message (Default)

If no redirect is specified, the form is replaced with a confirmation message after successful submission:

```typescript
const form = {
  // ...
  confirmationMessage: 'Thank you for your submission!'
}
```

### Redirect

If a redirect URL is provided, the user is redirected immediately after successful submission:

```typescript
const form = {
  // ...
  redirect: {
    url: '/thank-you'
  }
}
```

## Accessibility

The FormBuilder component meets WCAG 2.1 Level AA standards:

- ✅ **Semantic HTML** - Uses `<form>`, `<label>`, proper heading hierarchy
- ✅ **ARIA Attributes** - `aria-invalid`, `aria-describedby`, `aria-live` regions
- ✅ **Keyboard Navigation** - All interactive elements are keyboard accessible
- ✅ **Error Announcements** - Screen readers announce validation errors
- ✅ **Loading States** - Screen reader announcements during form submission
- ✅ **Required Fields** - Visual and semantic indication of required fields

## Responsive Design

Mobile-first implementation with:
- Full-width inputs on mobile
- Stacked field layout on small screens
- Responsive text sizing (sm: prefix for tablet/desktop)
- Touch-friendly button sizes

## Performance

- Uses React Hook Form for optimized form state management
- Minimal re-renders during user input
- Efficient validation handling
- Lazy loading of confirmation messages

## Examples

See [FormBuilder.stories.tsx](FormBuilder.stories.tsx) for comprehensive examples including:
- Contact form
- Registration form with all field types
- Simple newsletter signup
- Form with validation errors
- Integration examples

## Related Components

- [Input](../../atoms/Input/Input.tsx) - Text input atom
- [Textarea](../../atoms/Textarea/Textarea.tsx) - Multi-line text atom
- [Select](../../atoms/Select/Select.tsx) - Dropdown selection atom
- [Checkbox](../../atoms/Checkbox/Checkbox.tsx) - Checkbox atom
- [Button](../../atoms/Button/Button.tsx) - Submit button atom
- [FormField](../../molecules/FormField/FormField.tsx) - Field wrapper molecule

## Dependencies

- `react-hook-form` (^7.53.2) - Form state management and validation

## Browser Support

Works in all modern browsers with HTML5 form validation support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- The component is designed to be data-driven and requires no code changes for new forms
- Labels and error messages should come from PayloadCMS (already localized)
- The parent page/component is responsible for fetching form configuration and handling actual API submission
- Field width configuration (`width` property) accepts any valid CSS class (e.g., `w-full`, `w-1/2`, `max-w-md`)
