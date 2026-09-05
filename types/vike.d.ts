/**
 * Global type extensions for Vike's PageContext and environment variables.
 * Adds Cloudflare Workers bindings and custom properties set by hooks such
 * as onBeforeRoute.
 */

import type { Locale } from '../server/cms-types'

/**
 * Typed environment variables from import.meta.env.
 *
 * Vite embeds client-side (PUBLIC__*) variables at build time. In dev,
 * server-side variables come from .env.local.
 *
 * @see env.ts for validation schemas
 */
interface ImportMetaEnv {
  // ===== Client-side (browser) environment variables =====
  // Vite embeds these at build time. Browser code can read them.

  /** PayloadCMS base URL (required for API requests) */
  readonly PUBLIC__SAHAJCLOUD_URL: string

  /** Mapbox access token for location search functionality */
  readonly PUBLIC__MAPBOX_ACCESS_TOKEN?: string

  /**
   * Published Sahaj Atlas client key for the `/map` widget embed.
   *
   * Public by design: it ships in the page's HTML and reaches only read-only
   * atlas data. When it is unset, the `/map` pages still server-render their
   * content. They just do not mount the interactive widget over it.
   */
  readonly PUBLIC__SAHAJ_ATLAS_KEY?: string

  /** Sentry DSN for client-side error tracking */
  readonly PUBLIC__SENTRY_DSN?: string

  /** Optional external status page URL shown during errors */
  readonly PUBLIC__STATUS_PAGE_URL?: string

  // ===== Server-side environment variables =====
  // Server code only. In dev, these come from .env.local. In production,
  // they come from Cloudflare Workers context.env.

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
          /** Cloudflare KV namespace that caches API responses */
          WEMEDITATE_CACHE?: KVNamespace
        }
      }
    }
  }
}

export {}
