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
 *
 * The class is `slugPattern` in SahajCloud's `atlas-url-contract.json`, and
 * what `lib/urls/slugify.ts` emits: a lowercased letter in any script, a mark
 * or a digit, in runs joined by single hyphens. Vike hands `urlPathname` over
 * decoded (`decodePathname`, segment by segment), so the letters arrive
 * native rather than escaped.
 *
 * ⚠ What this refuses 404s. SahajCloud#1269 keeps native letters in every
 * `slugField`, so narrowing the class back to ASCII leaves `/über-uns` with
 * no page at all.
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long (max 100 characters)')
  .regex(
    /^[\p{Ll}\p{Lm}\p{Lo}\p{M}\p{N}]+(?:-[\p{Ll}\p{Lm}\p{Lo}\p{M}\p{N}]+)*$/u,
    'Slug must be lowercase letters, marks, or digits joined by single hyphens (none leading, trailing, or consecutive)',
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

// ===== Configuration Schemas =====

/**
 * Schema for validating API keys.
 * Used by both server/sahajcloud/context.ts and payload-client.ts for consistent validation.
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
