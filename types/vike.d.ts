/**
 * Global type extensions for Vike's PageContext and environment variables.
 * Adds Cloudflare Workers bindings and custom properties set by hooks such
 * as onBeforeRoute.
 */

import type { KVNamespace } from '@cloudflare/workers-types'

import type { Locale, WebTranslations } from '../server/cms-types'
import type { LivePreviewState } from '../server/live-preview'

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

  /**
   * Ed25519 **public** key (base64) that verifies live-preview tokens minted
   * by SahajCloud.
   *
   * Not a secret, which is the point: a verification key cannot mint, so
   * publishing it costs nothing, and there is no second copy of a shared
   * secret to keep in sync with the CMS. Unset, live preview is simply not
   * available and every request renders published content.
   */
  readonly PUBLIC__LIVE_PREVIEW_VERIFY_KEY?: string

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

      /**
       * The live-preview verdict for this request, set by `onBeforeRoute`.
       * Carries the verdict and the scope — never the token itself.
       */
      livePreview: LivePreviewState

      /**
       * The locale's UI strings, from the CMS `wm-web-translations`
       * global. Added by `pages/+onBeforeRender.ts` and carried to the
       * client by `passToClient`. Read it through `useT()`, never directly.
       */
      translations: WebTranslations

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
