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
 * The CollectionType is defined in pages/preview/_components/types.ts
 */
export const collectionSchema = z.enum(['pages', 'meditations'])

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
