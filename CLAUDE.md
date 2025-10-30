# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeMeditateWeb is a server-side rendered web application built with **Vike** (full-stack meta-framework), **React 19**, and **TypeScript**, deployed to **Cloudflare Workers**. It fetches content from a PayloadCMS backend via GraphQL and implements sophisticated edge caching using Cloudflare KV.

**Stack**: Vike + React + TypeScript + Hono + Tailwind CSS + Cloudflare Workers + PayloadCMS GraphQL

## Common Development Commands

```bash
# Development server (default port 5173)
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Local testing with Wrangler (Cloudflare Workers runtime)
pnpm prod

# Deploy to Cloudflare Workers
pnpm deploy

# Linting
pnpm lint
```

## Environment Setup

Create a `.env` file with these variables (see [.env.example](.env.example)):

```bash
PAYLOAD_API_KEY=<your-api-key>           # PayloadCMS API authentication
PUBLIC_ENV__PAYLOAD_URL=<cms-url>        # GraphQL endpoint URL
SENTRY_DSN=<dsn>                         # Server-side error tracking
PUBLIC_ENV__SENTRY_DSN=<dsn>             # Browser-side error tracking
```

Variables prefixed with `PUBLIC_ENV__` are exposed to the browser.

## Architecture

### Routing System (Vike File-Based)

Vike uses a convention-based router where files in `pages/` define routes:

- **Dynamic Routes**: [pages/[slug]/+route.ts](pages/[slug]/+route.ts) matches paths like `/about`, `/contact`
- **Locale Handling**: [pages/+onBeforeRoute.ts](pages/+onBeforeRoute.ts) extracts locale from URL patterns like `/es/about`
  - Locale is made available via `pageContext.locale`
  - English locale (`en`) prefix is removed from URLs (redirects `/en/about` → `/about`)
  - Supports: `en`, `es`, `de`, `it`, `fr`, `ru`, `ro`, `cs`, `uk`, and more
- **Route Parameters**: Accessible in data functions via `pageContext.routeParams`

**Request Flow Example**:
```
GET /es/about
  → onBeforeRoute extracts locale='es'
  → Route matcher extracts slug='about'
  → +data.ts runs with { locale: 'es', slug: 'about' }
  → GraphQL fetches page from PayloadCMS
  → +Page.tsx renders with fetched data
```

### Data Fetching (Server-Side Rendering)

All pages use Vike's `+data.ts` pattern for SSR:

- **[pages/[slug]/+data.ts](pages/[slug]/+data.ts)**: Fetches page content via `getPageBySlug()`
- **[pages/preview/+data.ts](pages/preview/+data.ts)**: Fetches draft content via `getPageById()` for live preview

Data functions receive `pageContext` with:
- `locale`: Current locale from URL
- `routeParams`: Dynamic route parameters (e.g., `{ slug: 'about' }`)
- `cloudflare.env`: Cloudflare Workers bindings (KV, environment variables)

### GraphQL Integration

GraphQL client is located in [server/graphql-client.ts](server/graphql-client.ts):

**Key Functions**:
- `getPageBySlug({ slug, locale, apiKey, kv? })` - Fetch page by slug (cached 1 hour)
- `getPageById({ id, apiKey, kv? })` - Fetch page by ID (NOT cached, for preview)
- `getWeMeditateWebSettings({ apiKey, kv? })` - Fetch global settings (cached 24 hours)
- `getMeditationById()`, `getPagesByTags()`, etc. - Other content fetchers

**Query Fragments**: Reusable GraphQL fragments are defined in [server/graphql-fragments.ts](server/graphql-fragments.ts):
- `fullPageFragment` - Complete page with author, tags, SEO metadata
- `mediaImageFragment` - Responsive image data
- `authorFragment`, `pageMetaFragment` - Reusable data structures
- `buildQueryWithFragments()` - Automatically resolves fragment dependencies

**Type Definitions**: All PayloadCMS schema types are in [server/graphql-types.ts](server/graphql-types.ts) (`Page`, `MediaImage`, `Author`, `WeMeditateWebSettings`, etc.)

### Caching Strategy (Cloudflare KV)

The app implements a **read-through cache pattern** using Cloudflare KV. See [server/CACHING.md](server/CACHING.md) for full documentation.

**Cache Configuration** ([server/kv-cache.ts](server/kv-cache.ts)):
- Pages: 1 hour TTL
- Settings: 24 hours TTL
- Lists: 30 minutes TTL
- Meditations/Music: 1 hour TTL

**Cache Keys Format**: `prefix:param1=value1:param2=value2`
- Example: `page:slug=home:locale=en`

**Graceful Degradation**: Cache is optional - app works without KV. All cache errors are caught and logged but don't crash requests.

**Cache Management Commands**:
```bash
# View cache contents (preview namespace)
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --preview

# Get specific cache entry
pnpm wrangler kv key get "page:slug=home:locale=en" --binding WEMEDITATE_CACHE --preview

# Delete cache entry (manual invalidation)
pnpm wrangler kv key delete "page:slug=home:locale=en" --binding WEMEDITATE_CACHE --preview

# Production cache (remove --preview flag)
pnpm wrangler kv key list --binding WEMEDITATE_CACHE
```

**KV Namespace Configuration** ([wrangler.toml](wrangler.toml)):
- Binding: `WEMEDITATE_CACHE`
- Production ID: `5c38f43ed50440a3bc7e06c8e9483856`
- Preview ID: `cf4eaa694eed4a7aa7f0482905e496a1`

### PayloadCMS Live Preview

The [pages/preview/](pages/preview/) route enables real-time content preview from PayloadCMS admin:

- Uses `@payloadcms/live-preview-react` with `useLivePreview` hook
- Receives updates via `window.postMessage` from PayloadCMS
- Shows yellow banner indicating preview mode
- Automatically fetches fresh data (caching is bypassed)

### Locale-Aware Components

**[components/Link.tsx](components/Link.tsx)**: Smart link component that auto-prefixes non-English locales:
```tsx
<Link href="/about" locale="es" />  // Renders: /es/about
<Link href="/about" locale="en" />  // Renders: /about (no prefix)
```

Falls back to `pageContext.locale` if locale prop is not specified.

### Layout Pattern

**[layouts/LayoutDefault.tsx](layouts/LayoutDefault.tsx)**: Single global layout that:
- Wraps all pages with sidebar + content area
- Builds navigation from `WeMeditateWebSettings` (homePage, techniquesPage, musicPage, etc.)
- Uses `useData<PageData>()` to access page data and settings

### Error Handling

**[pages/_error/+Page.tsx](pages/_error/+Page.tsx)**: Unified error page for 404 and 500 errors. Uses `pageContext.is404` to differentiate.

## Cloudflare Workers Deployment

The app runs on Cloudflare Workers with server-side rendering:

**Server Entry**: [server/entry.ts](server/entry.ts) uses `@photonjs/hono` to create a Hono server with Vike request handler

**Build Output**:
```
dist/
├── client/              # Client JavaScript bundles
├── server/              # Server JavaScript (runs on Workers)
└── server/wrangler.json # Auto-generated Wrangler config
```

**Wrangler Config**: [wrangler.toml](wrangler.toml)
- Worker name: `wemeditate-web`
- Compatibility flags: `nodejs_compat`
- KV namespace: `WEMEDITATE_CACHE` (for edge caching)

## File Structure (Key Directories)

```
pages/                    # Vike file-based routing
├── +config.ts           # Global Vike config (layout, title)
├── +client.ts           # Browser entry point (Sentry initialization)
├── +Head.tsx            # Global <head> component
├── +onBeforeRoute.ts    # Route hook for locale extraction
├── [slug]/              # Dynamic pages route
│   ├── +Page.tsx        # Page component
│   ├── +data.ts         # SSR data fetching
│   └── +route.ts        # Route matcher
├── preview/             # PayloadCMS live preview
└── _error/              # Error pages (404/500)

layouts/                 # Layout components
└── LayoutDefault.tsx    # Global layout with sidebar/nav

components/              # Reusable UI components
└── Link.tsx            # Locale-aware link component

server/                  # Server-side utilities
├── entry.ts            # Cloudflare Workers server setup
├── graphql-client.ts   # GraphQL query functions with caching
├── graphql-fragments.ts # Reusable GraphQL fragments
├── graphql-types.ts    # PayloadCMS TypeScript types
├── kv-cache.ts         # Cloudflare KV caching layer
└── CACHING.md          # Caching documentation

types/                   # Global TypeScript types
└── vike.d.ts           # PageContext extensions (locale, KV bindings)
```

## Special Conventions

### PageContext Type Extensions

[types/vike.d.ts](types/vike.d.ts) extends Vike's `PageContext` to add:
- `locale: Locale` - Current locale from URL
- `cloudflare.env.WEMEDITATE_CACHE` - KV namespace binding for caching

This enables type-safe access to locale and KV in all data functions and components.

### Vike Configuration

[pages/+config.ts](pages/+config.ts) configures:
- Default layout component
- Default page title
- Global `<head>` tags
- Extends `vike-react` and `vike-photon` presets

### Page Transition Hooks

- [pages/+onPageTransitionStart.ts](pages/+onPageTransitionStart.ts)
- [pages/+onPageTransitionEnd.ts](pages/+onPageTransitionEnd.ts)

These enable page transition animations (currently minimal implementation).

## Sentry Error Tracking

**Browser Config**: [sentry.browser.config.ts](sentry.browser.config.ts)
- 100% transaction sampling
- 10% session replay (100% on errors)
- **Only activated in production** (`import.meta.env.PROD === true`)

**Testing Sentry**: Visit `/sentry` page in production build to trigger test errors

**Source Maps**: Uploaded via `@sentry/vite-plugin` in [vite.config.ts](vite.config.ts)
- Requires `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in `.env.sentry-build-plugin`

## Working with GraphQL

### Adding New Query Functions

1. Define TypeScript types in [server/graphql-types.ts](server/graphql-types.ts)
2. Create reusable fragments in [server/graphql-fragments.ts](server/graphql-fragments.ts) if needed
3. Add query function in [server/graphql-client.ts](server/graphql-client.ts):
   ```typescript
   export async function getNewContent({ slug, locale, apiKey, kv }: QueryParams) {
     const query = buildQueryWithFragments(`
       query GetNewContent($slug: String!, $locale: Locale!) {
         newContent(where: { slug: { equals: $slug } }, locale: $locale) {
           ...fullPageFragment
         }
       }
     `, ['fullPageFragment'])

     return withCache({
       cacheKey: generateCacheKey('new-content', { slug, locale }),
       ttl: CacheTTL.PAGE,
       kv,
       fetchFn: async () => {
         const client = createGraphQLClient(apiKey)
         const response = await client.request(query, { slug, locale })
         return response.newContent
       }
     })
   }
   ```

### Query Authentication

All GraphQL requests require authentication via `Authorization: clients API-Key {apiKey}` header. The API key is passed from environment variables through data functions.

## Build Configuration

**[vite.config.ts](vite.config.ts)** includes:
- `vike()` - File-based routing and SSR
- `react()` - React support with automatic JSX runtime
- `tailwindcss()` - Tailwind CSS integration
- `sentryVitePlugin()` - Source map upload for error tracking

## Tailwind CSS

Tailwind v4.1.16 is configured via `@tailwindcss/vite` plugin. CSS is automatically processed during build.

## TypeScript Configuration

[tsconfig.json](tsconfig.json) is configured for:
- React 19 with automatic JSX runtime
- Vite environment types
- Cloudflare Workers types (`@cloudflare/workers-types`)
- Strict type checking
