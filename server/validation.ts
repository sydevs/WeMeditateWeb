/**
 * Shared Zod validation schemas for route parameters.
 *
 * Use `.parse()` to validate and throw on error.
 *
 * @example
 * import { slugSchema, idSchema } from './validation'
 * import { render } from 'vike/abort'
 *
 * try {
 *   const slug = slugSchema.parse(routeParams.slug)
 * } catch (error) {
 *   throw render(404, error instanceof Error ? error.message : 'Invalid slug')
 * }
 */

import { z } from 'zod'

/**
 * Schema for validating page/content slugs.
 * Lowercase letters, numbers, hyphens only. No leading/trailing/consecutive hyphens.
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long (max 100 characters)')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens (no consecutive hyphens, no leading/trailing hyphens)',
  )

/**
 * Schema for validating numeric IDs.
 * Coerces a string to a number, validates it, then transforms it back to
 * a string, for API compatibility.
 *
 * Capped at Postgres `int4`: SahajCloud answers a larger id with a 500, not a
 * 404, so it would cost three retried reads and then an error page.
 */
export const idSchema = z.coerce
  .number({ message: 'ID must be a number' })
  .int('ID must be an integer')
  .positive('ID must be positive')
  .max(2147483647, 'ID out of range')
  .transform(String)

// ===== Submission Schemas =====

/**
 * ⚠ The loosest bounds SahajCloud allows (`src/collections/UserSubmissions/
 * submissionData.ts`: 40 entries, 100-character keys, and 5000 for its
 * longest-valued key), in characters. `email` is not one of them: it is
 * RFC 5321's longest address.
 */
const SUBMISSION_BOUNDS = { entries: 40, field: 100, value: 5000, email: 254 } as const

/**
 * One submission the same-origin forms route will forward to SahajCloud.
 *
 * ⚠ The bounds are a cheap refusal at the edge, never the enforcement — the
 * collection re-checks every one per type, per key, against the fields the
 * form's author declared, which only it knows.
 *
 * ⚠ `form` is a **number**. A quoted id reaches the intake as an unresolvable
 * relationship; `SubmissionBody` in `lib/submissions.ts` states what that costs.
 *
 * `type` is narrowed to the two form-backed intakes. Registrations and event
 * proposals are the atlas widget's, and neither carries a `form`.
 */
export const submissionSchema = z.object({
  form: z.number().int().positive('Form must be a document id'),
  type: z.enum(['contact', 'subscribe']),
  senderEmail: z
    .email('Sender email must be an email address')
    .max(SUBMISSION_BOUNDS.email)
    .optional(),
  submissionData: z
    .array(
      z.object({
        field: z.string().min(1).max(SUBMISSION_BOUNDS.field),
        value: z.string().max(SUBMISSION_BOUNDS.value),
      }),
    )
    .max(SUBMISSION_BOUNDS.entries),
})

/**
 * The most bytes a submission's request body may carry before the route
 * refuses it unread.
 *
 * Six bytes a character is `JSON.stringify`'s worst case (a control character
 * becomes `\u001f`), and 4 KiB covers the JSON around the strings, so no body
 * `submissionSchema` accepts is refused for its size. The bound only stops a
 * body the schema would refuse anyway from being buffered and parsed first.
 */
export const SUBMISSION_BODY_LIMIT =
  6 *
    (SUBMISSION_BOUNDS.entries * (SUBMISSION_BOUNDS.field + SUBMISSION_BOUNDS.value) +
      SUBMISSION_BOUNDS.email) +
  4096

// ===== Configuration Schemas =====

/**
 * Schema for validating API keys.
 * Used by both sahajcloud-context.ts and payload-client.ts for consistent validation.
 */
export const apiKeySchema = z
  .string()
  .min(1, 'API key is required')
  .regex(/^[a-zA-Z0-9-]+$/, 'API key must contain only alphanumeric characters and dashes')

/**
 * Schema for validating base URLs.
 * Used for SahajCloud API endpoint validation.
 */
export const baseUrlSchema = z.url('Base URL must be a valid URL')
