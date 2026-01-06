# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference Documentation

**IMPORTANT**: Before working with components, design, or stories, read these comprehensive guides:

- **@DESIGN_SYSTEM.md** - Component architecture, atomic design methodology, design tokens, accessibility standards, and implementation guidelines
- **@STORYBOOK.md** - Component story writing patterns, utility components, section organization, and Ladle configuration
- **@MCP_USAGE.md** - MCP server best practices for Puppeteer, Serena, and Cloudflare Docs

## Project Overview

WeMeditateWeb is a server-side rendered web application built with **Vike** (full-stack meta-framework), **React 19**, and **TypeScript**, deployed to **Cloudflare Workers**. It fetches content from a PayloadCMS backend via REST API and implements sophisticated edge caching using Cloudflare KV.

**Stack**: Vike + React + TypeScript + Hono + Tailwind CSS + Cloudflare Workers + PayloadCMS REST API

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

# Component development with Ladle (port 61000)
pnpm ladle

# Build static component library
pnpm ladle:build
```

## Service Dependencies

This project integrates with the following external services:

### SahajCloud (Required)
- **Purpose**: Headless CMS (PayloadCMS) providing content via REST API
- **Used for**: Pages, articles, meditations, site settings, and all dynamic content
- **Configuration**: `SAHAJCLOUD_API_KEY` and `PUBLIC__SAHAJCLOUD_URL` in `.env.local`
- **Documentation**: REST API client in [server/cms-client.ts](server/cms-client.ts)

### Cloudflare Workers & KV (Required for Production)
- **Purpose**: Edge computing platform and key-value storage for caching
- **Used for**: Server-side rendering at the edge, caching API responses
- **Configuration**: `WEMEDITATE_CACHE` KV namespace in [wrangler.toml](wrangler.toml)
- **Documentation**: [server/CACHING.md](server/CACHING.md)

### Mapbox (Required for Location Features)
- **Purpose**: Mapping and location search services
- **Used for**: LocationSearch component (address/city autocomplete with geolocation)
- **Configuration**: `PUBLIC__MAPBOX_ACCESS_TOKEN` in `.env`
- **API**: Uses Mapbox Search Box API with session-based pricing
- **Preferred Provider**: Mapbox is the preferred provider for all mapping-related services in this project

### Sentry (Optional)
- **Purpose**: Error tracking and performance monitoring
- **Used for**: Browser and server-side error reporting in production
- **Configuration**: `SENTRY_DSN` (server) and `PUBLIC__SENTRY_DSN` (browser) in `.env`
- **Note**: Only activates in production builds (`import.meta.env.PROD === true`)

## MCP Servers

This project uses Model Context Protocol (MCP) servers to enhance Claude Code's capabilities. See @MCP_USAGE.md for comprehensive documentation.

**Installed Servers**:
- **Puppeteer** (`@modelcontextprotocol/server-puppeteer`) - Browser automation for design extraction and testing
- **Serena** (`mcp__serena`) - Semantic codebase navigation and intelligent code operations
- **Cloudflare Docs** (`mcp__cloudflare-docs`) - Search Cloudflare product documentation

**Quick Tips**:
- Use Puppeteer's `evaluate` tool with explicit `return` statements (see @MCP_USAGE.md)
- Use Serena for token-efficient code reading (avoid reading entire files)
- Prefer MCP tools over direct bash commands for code search and navigation

## Environment Setup

```bash
# Setup (one command)
cp .env.example .env.local

# Then edit .env.local with your actual values
```

Both development modes automatically read from `.env.local`:
- **Vite development** (`pnpm dev`) - reads `.env.local` directly
- **Cloudflare Workers** (`pnpm prod`) - falls back to `.env.local` when `.dev.vars` is not present

**Required variables** (see [.env.example](.env.example)):

```bash
# Server-side only (never exposed to browser)
SAHAJCLOUD_API_KEY=<your-api-key>       # SahajCloud API authentication
SENTRY_DSN=<dsn>                         # Server-side error tracking

# Browser-accessible (embedded in bundles at build time)
PUBLIC__SAHAJCLOUD_URL=<cms-url>        # PayloadCMS base URL
PUBLIC__SENTRY_DSN=<dsn>                 # Browser-side error tracking
PUBLIC__MAPBOX_ACCESS_TOKEN=<token>      # Mapbox API key for LocationSearch component
```

**Variable Sources:**

| Variable Type | Development | Production |
|---------------|-------------|------------|
| Server secrets | `.env.local` | Cloudflare dashboard |
| Build-time public | `.env.local` | `.env.production` (git) |
| Build-time secrets | `.env.local` | Cloudflare dashboard |

**Variable Prefixes:**
- `PUBLIC__` - Exposed to browser, embedded at build time via `envPrefix: 'PUBLIC__'` in `vite.config.ts`
- No prefix - Server-side only, accessed at runtime via `context.cloudflare.env`

**Production Deployment:**
- **Secrets**: Set as encrypted variables in Cloudflare dashboard (Workers & Pages → wemeditate-web → Settings)
- **Build-time public vars**: Fixed values in `.env.production` (committed to git, no secrets)

**Note**: `PUBLIC__` means "browser-accessible," not "public knowledge." Variables like `PUBLIC__MAPBOX_ACCESS_TOKEN` are still YOUR secret tokens (restrict by domain).

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
  → REST API fetches page from PayloadCMS
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

### REST API Integration

The PayloadCMS REST API client is located in [server/cms-client.ts](server/cms-client.ts):

**Key Functions**:
- `getPageBySlug({ slug, locale, apiKey, kv? })` - Fetch page by slug (cached 1 hour)
- `getPageById({ id, apiKey, kv? })` - Fetch page by ID (NOT cached, for preview)
- `getWeMeditateWebSettings({ apiKey, kv? })` - Fetch global settings (cached 24 hours)
- `getMeditationById()`, `getPagesByTags()`, etc. - Other content fetchers

**SDK Client Factory**: [server/payload-client.ts](server/payload-client.ts) provides:
- `createPayloadClient()` - Creates configured PayloadCMS SDK instance
- `PayloadAPIError` - Error class compatible with retry logic in error-utils.ts
- `validateSDKResponse()` - Handles SDK bug where errors return undefined instead of throwing

**Type Definitions**: PayloadCMS schema types are in [server/payload-types.ts](server/payload-types.ts), with app-specific types in [server/cms-types.ts](server/cms-types.ts)

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

**[components/atoms/Link/Link.tsx](components/atoms/Link/Link.tsx)**: Smart link component that auto-prefixes non-English locales:
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

The app implements graceful error handling with automatic retry and user-friendly error messages.

**Error Detection and Retry** ([server/error-utils.ts](server/error-utils.ts)):
- Automatically detects error types (network, server, client)
- Retries network and server errors with exponential backoff (3 attempts, 1s/2s/4s delays)
- Logs all retry attempts to Sentry for monitoring
- Does NOT retry client errors (400, 401, 403, 404)

**Retry Behavior**:
- **Attempt 1**: Immediate request
- **Attempt 2**: Wait ~1 second, retry
- **Attempt 3**: Wait ~2 seconds, retry
- **Attempt 4** (if max=4): Wait ~4 seconds, retry
- Jitter added to prevent thundering herd

**Error Pages and Components**:
- **[pages/_error/+Page.tsx](pages/_error/+Page.tsx)**: Enhanced error page for 404 and 500 errors
  - 404: "Page Not Found" with home link
  - 500: "Service Temporarily Unavailable" with retry button
  - Optional status page link via `PUBLIC__STATUS_PAGE_URL`

- **[components/molecules/ErrorFallback](components/molecules/ErrorFallback/ErrorFallback.tsx)**: React Error Boundary fallback
  - Detects error type and shows contextual icon (WiFi, Server, Exclamation)
  - User-friendly messages based on error type
  - "Try Again" button (reloads page) and "Back to Home" link
  - Technical details in dev mode

**User-Friendly Error Messages**:
- **Network errors**: "Unable to connect to our content servers. Please check your internet connection."
- **Server errors**: "Our content servers are experiencing issues. We're working to resolve this."
- **Client errors**: "This content is not available. It may have been moved or deleted."

**Configuration**:
```bash
# Cloudflare dashboard (optional)
PUBLIC__STATUS_PAGE_URL=<url>     # Optional external status page
```

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

components/              # Reusable UI components (Atomic Design structure)
├── atoms/              # Basic building blocks (Button, Input, Link, etc.)
│   ├── Link/          # Locale-aware link component
│   ├── svgs/          # Standalone SVG components (LogoSvg, LeafSvg, etc.)
│   └── README.md      # Complete atoms documentation
├── molecules/          # Simple component groups (FormField, SearchBar, etc.)
├── organisms/          # Complex sections (Header, Footer, MeditationGrid, etc.)
└── templates/          # Page layout structures

server/                  # Server-side utilities
├── entry.ts            # Cloudflare Workers server setup
├── cms-client.ts       # REST API query functions with caching
├── payload-client.ts   # PayloadCMS SDK factory and utilities
├── payload-types.ts    # PayloadCMS TypeScript types (auto-generated)
├── cms-types.ts        # App-specific types (Locale, populated relationships)
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

## Working with REST API

### Adding New Query Functions

1. Define or import TypeScript types from [server/payload-types.ts](server/payload-types.ts)
2. Add app-specific types to [server/cms-types.ts](server/cms-types.ts) if needed
3. Add query function in [server/cms-client.ts](server/cms-client.ts):
   ```typescript
   export async function getNewContent(options: QueryOptions & { slug: string }) {
     return withCache({
       cacheKey: generateCacheKey('new-content', { slug: options.slug, locale: options.locale }),
       ttl: CacheTTL.PAGE,
       kv: options.kv,
       bypassCache: options.bypassCache,
       fetchFn: async () => {
         const client = createPayloadClient({
           apiKey: options.apiKey,
           baseURL: options.baseURL,
         })

         const result = await client.find({
           collection: 'content',
           where: { slug: { equals: options.slug } },
           locale: options.locale,
           depth: 2,
         })

         return validateSDKResponse(result.docs[0], `getNewContent(${options.slug})`)
       },
     })
   }
   ```

### Updating PayloadCMS Types

When the CMS schema changes, regenerate types:
```bash
pnpm types:cms
```

This downloads the latest `payload-types.ts` from SahajCloud.

### API Authentication

All REST API requests require authentication via `Authorization: clients API-Key {apiKey}` header. The SDK client factory handles this automatically.

## Build Configuration

**[vite.config.ts](vite.config.ts)** includes:
- `vike()` - File-based routing and SSR
- `react()` - React support with automatic JSX runtime
- `tailwindcss()` - Tailwind CSS integration
- `sentryVitePlugin()` - Source map upload for error tracking

## Tailwind CSS

Tailwind v4.1.16 is configured via `@tailwindcss/vite` plugin using the **CSS-first configuration approach**.

**Theme Configuration**: [layouts/tailwind.css](layouts/tailwind.css) - Uses `@theme` directive for customization:
- Brand colors (teal, coral, gray palettes with semantic colors)
- Typography (Raleway and Futura Book fonts with weights 200-700)
- Custom font weights (200-700)
- Semantic colors (error, success, info)
- Uses Tailwind CSS defaults for spacing, font sizes, shadows, and animations

**Important**: In Tailwind v4, theme customization is done via the `@theme` directive in CSS, NOT in `tailwind.config.ts`. The config file only specifies content paths for class detection.

**Fonts**: Web fonts are loaded via [layouts/fonts.css](layouts/fonts.css):
- Raleway (weights: 200, 300, 400, 500, 600, 700) - Primary font family
- Futura Book (weight: 400) - Secondary font family
- WeMeditate Icons - Custom icon font
- Font files located in [public/fonts/](public/fonts/) (WOFF2 + WOFF formats)
- Uses `font-display: swap` for optimal performance

## TypeScript Configuration

[tsconfig.json](tsconfig.json) is configured for:
- React 19 with automatic JSX runtime
- Vite environment types
- Cloudflare Workers types (`@cloudflare/workers-types`)
- Strict type checking

## Design System

This project uses the **Atomic Design Methodology** to build a consistent, scalable component library.

**IMPORTANT**: Before creating any UI component, you MUST:
1. Read @DESIGN_SYSTEM.md for component architecture, implementation guidelines, and accessibility standards
2. Read @STORYBOOK.md before writing component stories
3. Follow these documents as the source of truth for all component development

See @DESIGN_SYSTEM.md for comprehensive guidelines on:

- **Design Principles**: Mobile-first, performance-focused, accessible development
- **Design Tokens**: Colors, typography, spacing scales from wemeditate.com brand
- **Component Architecture**: Atoms, molecules, organisms, templates, and pages structure
- **Implementation Guidelines**: Best practices for building components with React + Tailwind CSS
- **Accessibility Standards**: WCAG 2.1 Level AA compliance requirements
- **File Organization**: How to structure component directories and exports

### Atomic Design Classification Guide

**IMPORTANT**: Before classifying any component, read @DESIGN_SYSTEM.md for complete component architecture and implementation guidelines.

Use this decision tree to classify components correctly:

- **Atom**: Single, indivisible UI element that cannot be broken down further
  - Examples: Button, Input, Icon, Label, Text, Checkbox
  - Test: Can this be divided into smaller functional pieces? If no → Atom

- **Molecule**: 2-3 atoms combined into a simple functional group
  - Examples: FormField (Label + Input + Error), SearchBar (Input + Button), Author (Avatar + Text)
  - Test: Does this combine multiple atoms into a single purpose? If yes → Molecule

- **Organism**: Complex section with multiple molecules and/or atoms
  - Examples: Header (Logo + Navigation + Search), Footer, Card Grid, Form
  - Test: Is this a complete section of a page? If yes → Organism

- **Template**: Page layout structure without real content
  - Examples: Article Layout, Dashboard Layout, Landing Page Template
  - Test: Does this define page-level structure? If yes → Template

**When in doubt**: Start with the smallest classification and move up if needed. It's easier to promote an atom to a molecule than demote a molecule to an atom.

**Quick Reference**:
- All UI components live in `components/` organized by atomic level (atoms/, molecules/, organisms/, templates/)
- See [components/atoms/README.md](components/atoms/README.md) for complete atoms documentation and usage examples
- Use design tokens consistently - avoid one-off custom values
- **ALWAYS implement mobile-first responsive design** - see responsive requirements below
- Maintain WCAG 2.1 AA accessibility standards
- Document components with JSDoc and usage examples

### Mobile-First Responsive Design Requirements

**CRITICAL**: All UI components MUST be implemented with mobile-first responsive design. This is not optional.

**Core Principles**:
1. **Start with mobile styles** (no breakpoint prefix) - design for the smallest screen first
2. **Progressively enhance** for larger screens using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
3. **Test at all breakpoints** before considering a component complete
4. **Consider touch targets** on mobile (minimum 44×44px for interactive elements)

**Tailwind Breakpoints**:
```css
/* Default (mobile): 0px and up */
sm:   /* 640px and up (small tablets) */
md:   /* 768px and up (tablets) */
lg:   /* 1024px and up (laptops) */
xl:   /* 1280px and up (desktops) */
2xl:  /* 1536px and up (large desktops) */
```

**Common Responsive Patterns**:

**Text Alignment**:
```tsx
// Center on mobile, left-aligned on desktop
className="text-center sm:text-left"

// Center on mobile, right-aligned on desktop
className="text-center sm:text-right"
```

**Layout**:
```tsx
// Stack vertically on mobile, horizontal on desktop
className="flex flex-col sm:flex-row"

// Full width on mobile, fixed width on desktop
className="w-full sm:w-auto"

// Hide on mobile, show on desktop
className="hidden sm:block"

// Show on mobile, hide on desktop
className="block sm:hidden"
```

**Spacing**:
```tsx
// Smaller padding on mobile, larger on desktop
className="px-4 py-2 sm:px-6 sm:py-4"

// Tighter spacing on mobile, more breathing room on desktop
className="gap-2 sm:gap-4 lg:gap-6"
```

**Typography**:
```tsx
// Smaller text on mobile, larger on desktop
className="text-2xl sm:text-4xl"

// Adjust line height responsively
className="leading-tight sm:leading-normal"
```

**Gradients and Visual Effects**:
```tsx
// Simpler effect on mobile, enhanced on desktop
className="before:w-1/2 sm:before:w-80"

// Centered gradient on mobile, positioned on desktop
className="before:left-0 sm:before:right-0 sm:before:left-auto"
```

**When to Apply Responsive Design**:
- ✅ **Always** for molecules and organisms (they must adapt to different contexts)
- ✅ **Frequently** for atoms when they have layout implications (containers, spacers, complex buttons)
- ⚠️ **Sometimes** for simple atoms (basic text, icons) - use judgment based on usage
- ❌ **Never skip** for page-level components (templates, organisms in layouts)

**Testing Checklist**:
Before marking a component as complete, verify:
- [ ] Renders correctly on mobile (< 640px)
- [ ] Transitions properly at `sm` breakpoint (640px)
- [ ] Looks good on tablets (`md`: 768px)
- [ ] Works well on desktop (`lg`: 1024px+)
- [ ] Touch targets are adequate on mobile (44×44px minimum)
- [ ] Text is readable at all sizes
- [ ] No horizontal scrolling on any breakpoint

### Common Components Reference

This project has specific patterns for frequently-used components. Always use these correctly:

#### Icon Component

The `Icon` component wraps Heroicons and uses the **`icon` prop** (not `name`):

```tsx
import { Icon } from '../atoms/Icon'
import { HeartIcon, CheckIcon } from '@heroicons/react/24/outline'

// ✅ Correct
<Icon icon={HeartIcon} size="md" />
<Icon icon={CheckIcon} size="sm" color="primary" />

// ❌ Wrong - don't use name prop
<Icon name="heart" size="md" />
```

**Heroicons Version**: This project uses **Heroicons v2**. Some icons were renamed:
- `ArrowRightOnRectangleIcon` → Use `ArrowRightStartOnRectangleIcon` (for logout/sign-out)
- Check [Heroicons v2 migration guide](https://github.com/tailwindlabs/heroicons/releases/tag/v2.0.0) for other changes

#### Button Component

The `Button` component can render as either a button or a link using the **`href` prop**:

```tsx
import { Button } from '../atoms/Button'
import { PlayIcon } from '@heroicons/react/24/outline'

// ✅ Correct - Button as link (renders as Link component)
<Button href="/meditations" variant="primary">View Meditations</Button>

// ✅ Correct - Button with action
<Button onClick={handleClick} variant="primary">Submit</Button>

// ✅ Correct - Button with icon
<Button icon={PlayIcon} variant="primary" aria-label="Play" />

// ❌ Wrong - Don't nest Link inside Button
<Button variant="primary">
  <Link href="/meditations">View Meditations</Link>
</Button>
```

**Props**:
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text'
  size?: 'sm' | 'md' | 'lg'
  href?: string           // When provided, renders as Link
  locale?: string         // For locale-aware navigation
  icon?: HeroIcon         // Heroicon component
  isLoading?: boolean
  disabled?: boolean
}
```

**Key Features**:
- **Link rendering**: When `href` is provided, Button automatically renders as a Link component internally
- **Locale-aware navigation**: Supports `locale` prop for non-English routes
- **Icon support**: Can render icon-only buttons with proper accessibility
- **Loading states**: Built-in loading state with `isLoading` prop
- **No nested interactive elements**: Using `href` prop avoids semantic HTML issues with nested buttons/links

**When to use href prop**:
- ✅ Navigation to other pages or routes
- ✅ Downloading files or external resources
- ❌ Triggering JavaScript actions (use `onClick` instead)

#### Link Component

The `Link` component is locale-aware and located at **`components/atoms/Link/`**:

```tsx
import { Link } from '../../atoms'         // ✅ Preferred: from barrel export
import { Link } from '../../atoms/Link'    // ✅ Alternative: direct import
import { Link } from '../Link'             // ✅ Correct from atoms/

// ❌ Wrong - outdated path
import { Link } from '../../Link'
```

**Props**:
```tsx
interface LinkProps {
  href: string
  locale?: string
  variant?: 'default' | 'primary' | 'secondary' | 'neutral' | 'unstyled'
  size?: 'sm' | 'base' | 'lg' | 'inherit'  // Default: 'inherit'
  external?: boolean
}
```

**Usage**:
```tsx
// Basic usage (inherits parent size)
<Link href="/about" locale="es">About Us</Link>

// With explicit size
<Link href="/contact" size="sm">Contact</Link>

// With variant (avoids custom className)
<Link href="/home" variant="primary">Home</Link>

// External link (opens in new tab)
<Link href="https://example.com" external>External Site</Link>
```

**Key Features**:
- **Locale-aware**: Automatically prefixes non-English locales (`/es/about`, `/fr/contact`)
- **Size inheritance**: Default `size="inherit"` makes links inherit parent font size
- **Variants**: Use built-in variants (`primary`, `secondary`, `neutral`) instead of custom className where possible
- **Accessibility**: External links include screen reader text "(opens in new tab)"

#### Divider Patterns

When creating decorative dividers (like LeafDivider or Footer divider), use this pattern:

```tsx
<div className="relative w-full text-center pt-[height]">
  {/* Full-width horizontal line */}
  <div className="w-full border-t border-gray-200 absolute bottom-0" />

  {/* Decorative element centered over the line */}
  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-white px-4">
    <DecorativeElement />
  </div>
</div>
```

This creates the effect where the decorative element sits in the middle of the line with a white background "breaking" the line.

### Refactoring to Use Component Variants

When refactoring existing components, look for opportunities to replace custom `className` styling with built-in component variants for better consistency and maintainability.

**When to Use Variants**:
- ✅ When the styling matches (or is close to) an existing variant
- ✅ When minor color/weight differences are acceptable for consistency
- ✅ When it reduces custom className complexity
- ❌ When the component needs very specific custom styling
- ❌ When the variant doesn't have the required properties

**Refactoring Pattern**:

1. **Identify candidates**: Look for components using Link (or other atoms) with custom className
2. **Match to variant**: Find the closest built-in variant
3. **Extract size to prop**: Use `size` prop instead of `text-*` className
4. **Keep necessary custom styles**: Retain className only for styles not covered by variant
5. **Test visual differences**: Verify minor changes are acceptable

**Example: Breadcrumbs Link**

Before:
```tsx
<Link
  href={item.href}
  className="text-teal-500 hover:text-teal-600 transition-colors no-underline"
>
  {item.label}
</Link>
```

After:
```tsx
<Link
  href={item.href}
  variant="primary"
  size="inherit"
  className="no-underline"
>
  {item.label}
</Link>
```

**Changes**: Slightly darker teal color (500→600) and medium font weight from primary variant. Custom `no-underline` retained.

**Example: Footer Links**

Before:
```tsx
<Link
  className={`text-gray-600 hover:text-teal-600 transition-colors ${
    isHero ? 'text-lg font-normal' : 'text-sm font-light'
  }`}
>
```

After:
```tsx
<Link
  variant="neutral"
  size={isHero ? 'lg' : 'sm'}
  className={`hover:text-teal-600 ${
    isHero ? 'font-normal' : 'font-light'
  }`}
>
```

**Changes**: Base color slightly darker (gray-600→gray-700), size controlled by prop. Custom hover color and font weights retained.

**Benefits**:
- More semantic (intent is clear from props)
- Easier to maintain (fewer inline styles)
- Better consistency across codebase
- Leverages design system tokens

## Component Development with Ladle

This project uses **[Ladle](https://ladle.dev/)** for component development and documentation. Ladle is a lightweight, Vite-powered alternative to Storybook.

**Quick Start**:
- Run component library: `pnpm ladle` (opens at [http://localhost:61000/](http://localhost:61000/))
- Build static library: `pnpm ladle:build`

**Writing Stories**:

**⚠️ CRITICAL**: Before writing ANY component story, you MUST read @STORYBOOK.md first. This is not optional.

Common mistakes when not following @STORYBOOK.md:
- ❌ Using raw HTML headings (`<h2>`, `<h3>`) instead of `<StorySection variant="subsection">`
- ❌ Using deprecated `StorySubsection` or `StoryExampleSection` components
- ❌ Not using `inContext={true}` prop for Examples sections
- ❌ Creating manual dividers instead of letting StorySection handle them

Key requirements:
- **First step**: Read @STORYBOOK.md to understand story structure and utility components
- Create `ComponentName.stories.tsx` alongside your component
- **Always use a single `Default` export** - never create multiple story exports
- Use proper `title` categorization (e.g., `"Atoms / Form"`, `"Molecules / Layout"`, `"Organisms"`)
- Add `storyName` attribute to the `Default` export for human-readable names
- **ALWAYS use story utility components** - never use raw HTML for structure:
  - `<StorySection>` - For all major sections
  - `<StorySection variant="subsection">` - For nested subsections (NOT raw `<h3>` tags)
  - `<StorySection inContext={true}>` - For all Examples sections
  - `StoryGrid` - Create table layouts for multi-dimensional component matrices
- Follow standard section order: Basic Examples → Variants → Colors → Shapes → States → Sizes → Widths → Padding → Examples
- Use horizontal subsection layout (`flex flex-wrap gap-8`) for side-by-side comparisons

**See STORYBOOK.md** for complete documentation on:
- Story utility components API reference
- Standard section order and naming conventions
- Writing stories with Component Story Format (CSF)
- Grid layouts for comprehensive variant matrices
- Best practices for consistent story organization
- Configuration and customization options

**Gold Standard Examples**:
- [Button](components/atoms/Button/Button.stories.tsx) - Comprehensive grid layout with subsections
- [Checkbox](components/atoms/Checkbox/Checkbox.stories.tsx) - Grid combining color × state
- [Text](components/atoms/Text/Text.stories.tsx) - Simple vertical stacking with sections

### Development Server Troubleshooting

**Hot Module Replacement (HMR) Behavior**:
- HMR works reliably for **file updates** (editing existing components)
- HMR **DOES NOT detect new files** (newly created components, stories, or routes)
- **ALWAYS restart Ladle** after creating new files - this is expected behavior, not a bug

**When to Restart Servers**:

**ALWAYS restart Ladle** (`pnpm ladle`) when:
- Creating new `.stories.tsx` files (HMR cannot detect new files)
- Creating new component directories
- Changing story title metadata (e.g., "Atoms / Form" → "Molecules / Sections")
- Stories appear as "Story not found" after creation
- New components don't appear in Ladle navigation

**Usually works without restart** (HMR handles these):
- Editing existing component code (component logic, styling, props)
- Editing existing story content
- CSS/styling changes in existing files
- TypeScript type changes in existing files
- Adding/removing/modifying component props

Restart Dev Server (`pnpm dev`) when:
- Adding new pages or routes
- Modifying Vike configuration files (`+config.ts`, `+route.ts`)
- Changes to environment variables in `.env`
- Cloudflare Workers bindings aren't working

**Fast Restart Pattern**:
```bash
# Stop existing process and restart in one command (Ladle)
lsof -ti:61000 | xargs kill && pnpm ladle

# Or use force kill if standard kill fails
lsof -ti:61000 | xargs kill -9 && pnpm ladle

# For dev server (port 5173)
lsof -ti:5173 | xargs kill && pnpm dev
```

**Browser Hard Refresh**:
- Use when CSS/style changes aren't applying: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Clears browser cache for the current page
- Usually not needed for component logic changes (HMR handles those)

**Port Conflicts**:
- If you see "Port already in use" errors, use `lsof -ti:<port>` to find the process
- Kill the process with the command above
- Check if you have multiple terminal sessions running the same command

## Design Extraction Workflow

When creating components based on existing designs from live websites (e.g., using `/code/clone-design` command):

### Step 1: Analyze the Existing Design

**Using Puppeteer** (preferred for live sites):
```javascript
// Navigate to the page
await puppeteer.navigate(url)

// Extract HTML structure and computed styles
const element = document.querySelector('.target-class')
const styles = window.getComputedStyle(element)
```

**When to ask for screenshots instead**:
- The website requires authentication
- The design is from a design file (Figma, Sketch)
- JavaScript-heavy sites where Puppeteer struggles
- When the user has already provided a screenshot

### Step 2: Translate Design to Tailwind Tokens

**IMPORTANT**: Before implementing, read @DESIGN_SYSTEM.md for design tokens, Tailwind usage guidelines, and mobile-first requirements.

**Always use Tailwind's built-in tokens** - never create custom CSS or arbitrary values unless explicitly required:

- **Spacing**: Use `px-4`, `py-8`, `gap-6` (not `px-[17px]` or custom values)
- **Colors**: Use `text-gray-600`, `bg-teal-500` (not `text-[#7b7b7b]`)
- **Typography**: Use `text-base`, `font-medium` (not `text-[16px]` or `font-[500]`)
- **Sizing**: Use `max-w-md`, `w-full` (not `max-w-[400px]`)

**If custom CSS is unavoidable**, consult the user first and explain:
1. What you need the custom value for
2. Why existing Tailwind tokens don't work
3. What the closest Tailwind token would be

### Step 3: Classify the Component

Use the Atomic Design Classification Guide above to determine if the component should be:
- An **atom** (single indivisible element)
- A **molecule** (2-3 atoms combined)
- An **organism** (complex section with multiple molecules)
- A **template** (page layout structure)

**Ask the user if uncertain** - don't guess at classification.

### Step 4: Extract Requirements Proactively

Before implementing, ask the user about:

**Dimensions**:
- Exact max-width (or closest Tailwind token)
- Spacing around and within the component
- Responsive behavior (mobile, tablet, desktop)

**Colors and Styling**:
- Which gray shade to use (400, 500, 600?)
- Opacity values for gradients or overlays
- Border styles and shadows

**Alignment and Layout**:
- Text alignment in different states
- Flex/grid layout behavior
- How component should float or position itself

**States and Variants**:
- What states does it need (hover, active, disabled)?
- What variants exist (sizes, colors, styles)?
- Edge cases (empty state, long content, loading)?

**Accessibility**:
- Semantic HTML requirements
- ARIA labels needed
- Keyboard navigation behavior

### Step 5: Implementation

1. **Create component file**: `components/{level}/{ComponentName}/{ComponentName}.tsx`
2. **Write TypeScript interfaces**: Clear prop types with JSDoc comments
3. **Implement with Tailwind only**: No custom CSS unless approved
4. **Add accessibility**: ARIA attributes, semantic HTML, keyboard support
5. **Create stories**: Follow @STORYBOOK.md guidelines
6. **Export from index**: Add to `components/{level}/index.ts`

### Step 6: Verification

After creating the component:
- Restart Ladle to see new stories
- Check all variants in the story
- Test responsive behavior
- Verify accessibility with semantic HTML
- Confirm it matches the original design

**Example Workflow**:
```
User: Create a Blockquote component based on .cb-text-textbox on https://example.com

1. Navigate to URL with Puppeteer
2. Extract HTML structure and computed styles
3. Analyze: This is a molecule (combines text + credit + gradient background)
4. Ask about: max-width, gradient coverage, alignment behavior, margins
5. Implement using only Tailwind tokens
6. Create comprehensive stories with variants and examples
7. Restart Ladle to verify
```

## Background Process Management

When working with background processes (especially Ladle), follow these guidelines:

### Starting Background Processes

- **Check before starting**: Use `BashOutput` to check if a process is already running
- **Use descriptive names**: When calling Bash tool, provide clear description
- **Avoid duplicates**: Don't start multiple instances of the same dev server
- **Track process IDs**: Keep note of shell IDs returned by Bash tool

### Managing Ladle Processes

```bash
# Check existing processes before starting
# Use: BashOutput tool with existing shell_id

# Start Ladle (only if not already running)
pnpm ladle

# Monitor output
# Use: BashOutput tool with shell_id

# Kill when done
# Use: KillShell tool with shell_id
```

### Process Cleanup

**When to kill processes**:
- ✅ Kill Ladle/dev server processes you started when done
- ✅ Kill processes that are no longer needed
- ✅ Kill duplicate processes of the same type

**What NOT to kill**:
- ❌ NEVER kill Chrome debugging processes (port 9222)
- ❌ NEVER kill processes you didn't start
- ❌ Chrome debugging may be shared across Claude instances

### Best Practices

1. **One dev server at a time**: Only run one Ladle instance
2. **Clean up after yourself**: Kill processes before starting new ones
3. **Monitor output**: Use BashOutput to check status and errors
4. **Descriptive descriptions**: Always provide context when starting processes

Example:
```typescript
// ✅ Good
Bash({
  command: "pnpm ladle",
  description: "Start Ladle component library",
  run_in_background: true
})

// ❌ Bad - no description, might be duplicate
Bash({ command: "pnpm ladle", run_in_background: true })
```

## Component Development Workflow

Follow this checklist when creating new components from scratch:

### 1. Planning Phase

**IMPORTANT**: Before starting, read:
- [ ] @DESIGN_SYSTEM.md for component architecture and design patterns
- [ ] @STORYBOOK.md for story structure and conventions

Then proceed with planning:
- [ ] Examine design (URL, images, or description)
- [ ] Identify atomic level (atom/molecule/organism)
- [ ] Determine required and optional props
- [ ] Plan variants and configurations
- [ ] Identify responsive behavior needs

### 2. Implementation Phase

- [ ] Create component file: `components/[level]/ComponentName/ComponentName.tsx`
  - Define TypeScript interface with JSDoc
  - Implement component with mobile-first approach
  - Add responsive breakpoints (md:, lg:)
  - Use only Tailwind tokens (no custom CSS)
  - **Extract any inline SVGs to `components/atoms/svgs/` and import them**

- [ ] Create barrel export: `components/[level]/ComponentName/index.ts`
  ```typescript
  export { ComponentName, type ComponentNameProps } from './ComponentName'
  ```

- [ ] Update parent index: `components/[level]/index.ts`
  ```typescript
  export { ComponentName } from './ComponentName'
  export type { ComponentNameProps } from './ComponentName'
  ```

**Import Pattern**: When importing atoms in other components:
- ✅ Preferred: `import { ComponentName } from '../../atoms'` (barrel export)
- ✅ Alternative: `import { ComponentName } from '../../atoms/ComponentName'` (direct import)
- Use the barrel export for cleaner imports when importing multiple atoms

### 3. Stories Phase

- [ ] Create story file: `components/[level]/ComponentName/ComponentName.stories.tsx`
  - Import from '@ladle/react' and component
  - Import story utilities from '../../ladle'
  - Follow @STORYBOOK.md section patterns
  - For **atoms**: Use grids for multi-dimensional variations
  - For **molecules**: Use sections with Minimal/Maximal subsections
  - Add Examples section with realistic usage
  - End with `<div />` to remove trailing divider

### 4. Testing Phase

- [ ] Start/restart Ladle if not running
  ```bash
  pnpm ladle  # Opens at http://localhost:61000
  ```

- [ ] Verify in browser:
  - All variants render correctly
  - Responsive behavior at different breakpoints
  - Interactive states work (hover, focus, active)
  - Matches original design

- [ ] Check TypeScript:
  ```bash
  pnpm exec tsc --noEmit
  ```

### 5. Completion Checklist

- [ ] Component follows @DESIGN_SYSTEM.md guidelines
- [ ] Story follows @STORYBOOK.md patterns
- [ ] All exports updated (component and parent index)
- [ ] No TypeScript errors
- [ ] Tested in Ladle
- [ ] Responsive behavior verified
- [ ] Accessibility considered (ARIA, semantic HTML)

### Quick Reference

**File Structure**:
```
components/
└── [atoms|molecules|organisms]/
    └── ComponentName/
        ├── ComponentName.tsx       # Component implementation
        ├── ComponentName.stories.tsx  # Ladle stories
        └── index.ts                # Barrel export
```

**Story Pattern for Molecules**:
```typescript
<StoryWrapper>
  <StorySection title="Variant Name">
    <div className="flex flex-col gap-8">
      <StorySection title="Minimal" variant="subsection">
        {/* Only required props */}
      </StorySection>

      <StorySection title="Maximal" variant="subsection">
        {/* All optional props */}
      </StorySection>
    </div>
  </StorySection>

  <StorySection title="Examples" inContext={true}>
    {/* Realistic usage examples */}
  </StorySection>

  <div />
</StoryWrapper>
```

## Batch Refactoring Patterns

When making widespread changes to component stories or other files, use these proven patterns for safe, efficient batch operations.

### Find and Replace in Story Files

**Pattern**: Use `perl` one-liners with `find` for precise text replacement across multiple files.

**Basic syntax**:
```bash
find components -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD_PATTERN/NEW_PATTERN/g'
```

**Examples**:

Replace deprecated prop usage:
```bash
# Replace variant="example" with inContext={true}
find components -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/ variant="example"/ inContext={true}/g'

# Replace StorySubsection with StorySection variant="subsection"
find components -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/StorySubsection label=/StorySection title=/g'
```

**Important flags**:
- `-print0` and `-0`: Handle filenames with spaces correctly
- `-i`: Edit files in-place
- `-pe`: Perl one-liner mode with automatic line processing
- `s/OLD/NEW/g`: Substitute globally (all occurrences per line)

### Verify Changes Before Committing

After batch replacements, always verify:

```bash
# Count remaining old patterns (should be 0)
grep -r 'variant="example"' components/**/*.stories.tsx | wc -l

# Show files that still have the old pattern
grep -l 'variant="example"' components/**/*.stories.tsx

# Show context around matches (if any)
grep -n -B2 -A2 'variant="example"' components/**/*.stories.tsx
```

### Safe Backup Pattern

For major refactoring, create backups first:

```bash
# Create timestamped backup
tar -czf "components-backup-$(date +%Y%m%d-%H%M%S).tar.gz" components/

# Or use git to create a safety branch
git checkout -b refactor/component-api-update
git add -A
git commit -m "Checkpoint before batch refactoring"

# After refactoring, verify changes
git diff HEAD~1 --stat
```

### Complex Multi-Step Refactoring

For changes requiring multiple steps:

```bash
# Step 1: Update imports
find components -name "*.stories.tsx" -print0 | xargs -0 perl -i -pe 's/StoryExampleSection/StorySection/g'

# Step 2: Update props
find components -name "*.stories.tsx" -print0 | xargs -0 perl -i -pe 's/<StorySection>/<StorySection title="Examples" inContext={true}>/g'

# Step 3: Verify each step
grep -l "StoryExampleSection" components/**/*.stories.tsx  # Should be empty
```

### Selective File Refactoring

Target specific directories or file patterns:

```bash
# Only atoms
find components/atoms -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD/NEW/g'

# Multiple directories
find components/atoms components/molecules -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD/NEW/g'

# Specific files matching pattern
find components -name "*Button*.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD/NEW/g'
```

### TypeScript Verification After Refactoring

Always run TypeScript checks after batch changes:

```bash
# Check for TypeScript errors
pnpm exec tsc --noEmit

# If there are many errors, pipe to file for review
pnpm exec tsc --noEmit 2>&1 | tee typescript-errors.log

# Count errors by type
pnpm exec tsc --noEmit 2>&1 | grep "error TS" | cut -d: -f4 | sort | uniq -c
```

### Rollback Pattern

If something goes wrong:

```bash
# Quick rollback with git (if changes are uncommitted)
git checkout -- components/

# Restore from backup
tar -xzf components-backup-YYYYMMDD-HHMMSS.tar.gz

# Selective rollback of specific files
git checkout -- components/atoms/Button/Button.stories.tsx
```

### Best Practices

**Before Refactoring**:
- [ ] Create a git checkpoint or backup
- [ ] Test the perl command on a single file first
- [ ] Verify the pattern matches exactly what you want to change

**During Refactoring**:
- [ ] Use specific patterns (avoid overly broad regex)
- [ ] Process one type of change at a time
- [ ] Verify after each major step

**After Refactoring**:
- [ ] Run `pnpm exec tsc --noEmit` to check for TypeScript errors
- [ ] Use `grep` to verify old patterns are gone
- [ ] Start Ladle to visually verify story changes
- [ ] Review `git diff` before committing

