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
 *   throw render(400, error instanceof Error ? error.message : 'Invalid slug')
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
    'Slug must be lowercase alphanumeric with hyphens (no consecutive hyphens, no leading/trailing hyphens)'
  )

/**
 * Schema for validating numeric IDs.
 * Coerces string to number, validates, transforms back to string for API compatibility.
 */
export const idSchema = z.coerce
  .number({ message: 'ID must be a number' })
  .int('ID must be an integer')
  .positive('ID must be positive')
  .transform(String)

/**
 * Schema for validating collection types in preview routes.
 */
export const collectionSchema = z.enum(['pages', 'meditations'])

export type CollectionType = z.infer<typeof collectionSchema>
