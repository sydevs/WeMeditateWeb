---
paths:
  - "server/validation.ts"
  - "server/payload-client.ts"
  - "pages/**/+data.ts"
  - "components/organisms/FormBuilder/**"
---

# Zod Validation

The project uses **Zod 4** for runtime schema validation at critical data boundaries.

## Validation Schemas Location

**Route Parameters** ([server/validation.ts](../../server/validation.ts)):
- `slugSchema` - Page slugs (lowercase alphanumeric with hyphens)
- `idSchema` - Numeric IDs (coerces to number, validates, returns string)
- `collectionSchema` - Preview collection types (pages, meditations)

**API Configuration** ([server/payload-client.ts](../../server/payload-client.ts)):
- `payloadConfigSchema` - API key and base URL validation
- `PayloadConfigError` - Error class with Zod issues

## Using Validation Schemas

Use `.parse()` to validate and throw on error:

```typescript
import { slugSchema, idSchema } from '../../server/validation'
import { render } from 'vike/abort'

// In a +data.ts file:
try {
  const slug = slugSchema.parse(routeParams.slug)
  const id = idSchema.parse(routeParams.id)  // Returns string
} catch (error) {
  throw render(404, error instanceof Error ? error.message : 'Validation error')
}
```

**Note**: Vike's `render()` only supports specific status codes: 401, 403, 404, 410, 429, 500, 503. For validation errors, use 404 since an invalid slug/ID means the resource doesn't exist.

## Adding New Validation Schemas

1. Add schema to [server/validation.ts](../../server/validation.ts):
   ```typescript
   export const mySchema = z.string().min(1).max(100)
   ```

2. Use in route handler with try/catch:
   ```typescript
   try {
     const value = mySchema.parse(input)
   } catch (error) {
     throw render(404, error instanceof Error ? error.message : 'Invalid input')
   }
   ```

## FormBuilder with Zod

FormBuilder supports an optional `schema` prop for Zod validation:

```typescript
import { z } from 'zod'

const contactSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
})

<FormBuilder
  form={formConfig}
  onSubmit={handleSubmit}
  schema={contactSchema}
/>
```

## Zod 4 Syntax Notes

Zod 4 has different syntax from Zod 3:
- URL validation: `z.url()` (not `z.string().url()`)
- Error types: Use custom interfaces instead of `z.ZodIssue`

