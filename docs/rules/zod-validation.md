---
paths:
  - "server/validation.ts"
  - "server/payload-client.ts"
  - "pages/**/+data.ts"
  - "components/organisms/FormBuilder/**"
---

# Zod Validation

The project uses Zod 4 for runtime schema validation at critical data boundaries.

## Where validation schemas live

**Route parameters** ([server/validation.ts](../../server/validation.ts)):
- `slugSchema` — a page slug (lowercase alphanumeric with hyphens)
- `idSchema` — a numeric id. It coerces the value to a number, validates it, then returns a string
- `collectionSchema` — a preview collection type (pages, meditations)

**Request bodies** ([server/validation.ts](../../server/validation.ts)):
- `submissionSchema` — one form submission the same-origin proxy will forward. Its bounds mirror
  SahajCloud's own, and are a cheap refusal at the edge rather than the enforcement: the
  collection re-checks every one per type, against the keys the form's author declared.

**API configuration** ([server/payload-client.ts](../../server/payload-client.ts)):
- `payloadConfigSchema` — validates the API key and base URL
- `PayloadConfigError` — an error class that carries the Zod issues

## Use a validation schema

Call `.parse()` to validate the value. It throws on a bad value.

```typescript
import { slugSchema, idSchema } from '../../server/validation'
import { render } from 'vike/abort'

// In a +data.ts file:
try {
  const slug = slugSchema.parse(routeParams.slug)
  const id = idSchema.parse(routeParams.id) // returns a string
} catch (error) {
  throw render(404, error instanceof Error ? error.message : 'Validation error')
}
```

Vike's `render()` accepts only these status codes: 401, 403, 404, 410, 429, 500, 503. Use 404 for
a validation error — an invalid slug or id means the resource does not exist.

## Add a new validation schema

1. Add the schema to [server/validation.ts](../../server/validation.ts):
   ```typescript
   export const mySchema = z.string().min(1).max(100)
   ```
2. Use it in the route handler inside a try/catch:
   ```typescript
   try {
     const value = mySchema.parse(input)
   } catch (error) {
     throw render(404, error instanceof Error ? error.message : 'Invalid input')
   }
   ```

## A CMS form is not validated with Zod here

`FormBuilder` takes no schema, and there is no prop to pass one. The rules a submission must meet
are the form author's (`required` on a field) and the CMS's (per-type allowed keys, length bounds,
the captcha), and neither is knowable from this side — an author adds a field whenever they like.
So the fields validate through react-hook-form's own `required`, `submissionSchema` bounds the
proxied body, and the collection is the authority. A Zod schema mirroring the CMS's rules would be
a second copy to keep in step.

## Zod 4 syntax notes

Zod 4 changes some syntax from Zod 3:
- URL validation: use `z.url()`, not `z.string().url()`.
- Error types: use a custom interface, not `z.ZodIssue`.
