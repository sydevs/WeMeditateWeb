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
 */
export const idSchema = z.coerce
  .number({ message: 'ID must be a number' })
  .int('ID must be an integer')
  .positive('ID must be positive')
  .transform(String)

// ===== Submission Schemas =====

/**
 * One submission the same-origin forms route will forward to the CMS.
 *
 * ⚠ The bounds mirror SahajCloud's own (`src/collections/UserSubmissions/
 * submissionData.ts`: 40 entries, 100-character keys, 5000 for the longest
 * value). They are a cheap refusal at the edge, never the enforcement — the
 * collection re-checks every one per type, against the keys the form's author
 * declared, which only it knows.
 *
 * `type` is narrowed to the two form-backed intakes. Registrations and event
 * proposals are the atlas widget's, and neither carries a `form`.
 */
export const submissionSchema = z.object({
  form: z.string().regex(/^\d+$/, 'Form must be a document id'),
  type: z.enum(['contact', 'subscribe']),
  senderEmail: z.email('Sender email must be an email address').max(254).optional(),
  submissionData: z
    .array(
      z.object({
        field: z.string().min(1).max(100),
        value: z.string().max(5000),
      }),
    )
    .max(40),
})

// ===== Configuration Schemas =====

/**
 * Schema for validating API keys.
 * Used by both cms-context.ts and payload-client.ts for consistent validation.
 */
export const apiKeySchema = z
  .string()
  .min(1, 'API key is required')
  .regex(/^[a-zA-Z0-9-]+$/, 'API key must contain only alphanumeric characters and dashes')

/**
 * Schema for validating base URLs.
 * Used for CMS API endpoint validation.
 */
export const baseUrlSchema = z.url('Base URL must be a valid URL')
