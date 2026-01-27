/**
 * Shared Zod validation schemas for server-side use.
 *
 * This module provides Zod schemas for validating:
 * - Route parameters (slugs, IDs)
 * - Locale codes
 * - Collection types
 *
 * Use `.parse()` to validate and throw on error, or `.safeParse()` for error handling.
 *
 * @example
 * import { slugSchema, idSchema, collectionSchema } from './validation'
 * import { render } from 'vike/abort'
 *
 * // In a +data.ts file - throws ZodError on invalid input:
 * try {
 *   const slug = slugSchema.parse(routeParams.slug)
 *   const id = idSchema.parse(routeParams.id)
 * } catch (error) {
 *   throw render(400, error instanceof Error ? error.message : 'Validation error')
 * }
 */

import { z } from 'zod'

/**
 * Valid locales supported by the CMS.
 * Must be kept in sync with Config['locale'] in payload-types.ts.
 */
export const VALID_LOCALES = [
  'en',
  'es',
  'de',
  'it',
  'fr',
  'ru',
  'ro',
  'cs',
  'uk',
  'el',
  'hy',
  'pl',
  'pt-br',
  'fa',
  'bg',
  'tr',
] as const

/**
 * Schema for validating locale parameters.
 */
export const localeSchema = z.enum(VALID_LOCALES)

/**
 * Schema for validating page/content slugs.
 *
 * Requirements:
 * - Lowercase letters, numbers, hyphens only
 * - Cannot start or end with hyphen
 * - No consecutive hyphens
 * - Between 1 and 100 characters
 *
 * @example
 * slugSchema.parse('about-us')     // ✓ Valid
 * slugSchema.parse('meditation-101') // ✓ Valid
 * slugSchema.parse('ABOUT')        // ✗ Uppercase
 * slugSchema.parse('-about')       // ✗ Leading hyphen
 * slugSchema.parse('about--us')    // ✗ Consecutive hyphens
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long (max 100 characters)')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens (no consecutive hyphens, no leading/trailing hyphens)'
  )

/**
 * Schema for validating numeric IDs.
 * PayloadCMS uses number IDs by default (defaultIdType: 'number').
 *
 * Uses z.coerce.number() to automatically convert string inputs to numbers,
 * validates, then transforms back to string for API compatibility.
 *
 * @example
 * idSchema.parse(42)    // ✓ Returns "42"
 * idSchema.parse('123') // ✓ Returns "123" (coerced, validated, stringified)
 * idSchema.parse(0)     // ✗ Must be positive
 * idSchema.parse(-1)    // ✗ Must be positive
 * idSchema.parse(1.5)   // ✗ Must be integer
 * idSchema.parse('abc') // ✗ Must be numeric
 */
export const idSchema = z.coerce
  .number({ message: 'ID must be a number' })
  .int('ID must be an integer')
  .positive('ID must be positive')
  .transform(String)

/**
 * Schema for validating collection types in preview routes.
 *
 * This should match the keys of PREVIEW_FETCHERS in pages/preview/+data.ts.
 */
export const collectionSchema = z.enum(['pages', 'meditations'])

export type CollectionType = z.infer<typeof collectionSchema>
