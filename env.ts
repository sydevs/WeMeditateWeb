/**
 * Environment variable validation schemas using Zod.
 *
 * Architecture:
 * - Client env vars: Validated at build time by vite-plugin-validate-env
 * - Server env vars: Validated at runtime in Cloudflare Workers context
 *
 * @see https://github.com/Julien-R44/vite-plugin-validate-env
 */

import { z } from 'zod'

/**
 * Client-side (browser) environment variables.
 * These are embedded at build time by Vite via import.meta.env.
 * Validated during `vite dev` and `vite build` to catch missing vars early.
 *
 * All variables must have the PUBLIC__ prefix as configured in vite.config.ts.
 */
export const clientEnvSchema = z.object({
  /** PayloadCMS base URL (required for API requests) */
  PUBLIC__SAHAJCLOUD_URL: z.url('PUBLIC__SAHAJCLOUD_URL must be a valid URL'),

  /** Mapbox access token for location search functionality */
  PUBLIC__MAPBOX_ACCESS_TOKEN: z.string().optional(),

  /** Sentry DSN for client-side error tracking */
  PUBLIC__SENTRY_DSN: z.url('PUBLIC__SENTRY_DSN must be a valid URL').optional(),

  /** Optional external status page URL shown during errors */
  PUBLIC__STATUS_PAGE_URL: z.url('PUBLIC__STATUS_PAGE_URL must be a valid URL').optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

/**
 * Server-side environment variables.
 * For Cloudflare Workers: accessed at runtime from context.env
 * For development: accessed from import.meta.env (via .env.local)
 *
 * Note: KVNamespace bindings (WEMEDITATE_CACHE) cannot be validated with Zod
 * as they are special Cloudflare Workers runtime bindings, not string values.
 */
export const serverEnvSchema = z.object({
  /** PayloadCMS API key for authenticated requests (required) */
  SAHAJCLOUD_API_KEY: z.string().min(1, 'SAHAJCLOUD_API_KEY is required'),

  /** Sentry DSN for server-side error tracking */
  SENTRY_DSN: z.url('SENTRY_DSN must be a valid URL').optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Validates server environment at runtime.
 * Call this in server entry or CMS context initialization.
 *
 * @param env - Object containing environment variables to validate
 * @returns Validated server environment
 * @throws Error if validation fails with descriptive message
 *
 * @example
 * const validatedEnv = validateServerEnv({
 *   SAHAJCLOUD_API_KEY: context.env.SAHAJCLOUD_API_KEY,
 *   SENTRY_DSN: context.env.SENTRY_DSN,
 * })
 */
export function validateServerEnv(env: Record<string, unknown>): ServerEnv {
  const result = serverEnvSchema.safeParse(env)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new Error(`Server environment validation failed: ${errors}`)
  }
  return result.data
}
