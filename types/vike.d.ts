/**
 * Global type extensions for Vike's PageContext and environment variables.
 * This file extends the default PageContext with Cloudflare Workers bindings
 * and custom properties added by hooks like onBeforeRoute.
 */

import type { Locale } from '../server/cms-types'

/**
 * Typed environment variables available via import.meta.env.
 *
 * Client-side (PUBLIC__*) variables are embedded at build time by Vite.
 * Server-side variables are available in dev via .env.local.
 *
 * @see env.ts for validation schemas
 */
interface ImportMetaEnv {
  // ===== Client-side (browser) environment variables =====
  // These are embedded at build time and accessible in browser code.

  /** PayloadCMS base URL (required for API requests) */
  readonly PUBLIC__SAHAJCLOUD_URL: string

  /** Mapbox access token for location search functionality */
  readonly PUBLIC__MAPBOX_ACCESS_TOKEN?: string

  /** Sentry DSN for client-side error tracking */
  readonly PUBLIC__SENTRY_DSN?: string

  /** Optional external status page URL shown during errors */
  readonly PUBLIC__STATUS_PAGE_URL?: string

  // ===== Server-side environment variables =====
  // Only available in server code (via .env.local in dev).
  // In production, these come from Cloudflare Workers context.env.

  /** PayloadCMS API key for authenticated requests */
  readonly SAHAJCLOUD_API_KEY?: string

  /** Sentry DSN for server-side error tracking */
  readonly SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace Vike {
    interface PageContext {
      /** Current locale (added by onBeforeRoute hook) */
      locale: Locale

      /** Cloudflare Workers runtime context */
      cloudflare?: {
        env?: {
          /** Cloudflare KV namespace for caching API responses */
          WEMEDITATE_CACHE?: KVNamespace
        }
      }
    }
  }
}

export {}
