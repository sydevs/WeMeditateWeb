/**
 * Shared helpers for smoke specs that hit the deployed Cloudflare preview.
 *
 * The app has no database — every page is rendered server-side from the
 * production PayloadCMS. These helpers verify the Worker actually returns real
 * rendered content (not an error boundary) over plain HTTP, which is the right
 * altitude for "did the server load the page?".
 */
import { expect } from 'vitest'

/** Resolved base URL of the preview (or fallback) to smoke-test against. */
export function getBaseUrl(): string {
  const url = process.env.PREVIEW_URL

  if (!url) {
    throw new Error(
      'PREVIEW_URL is not set. Smoke specs run against a deployed preview — ' +
        'set PREVIEW_URL=https://… (CI sets it from scripts/get-cloudflare-preview-url.mjs).',
    )
  }

  return url.replace(/\/$/, '')
}

export interface PageResult {
  status: number
  finalUrl: string
  location: string | null
  contentType: string
  html: string
}

/** Fetch a path on the preview and return status + body + key headers. */
export async function fetchPage(
  path: string,
  init: { redirect?: RequestRedirect } = {},
): Promise<PageResult> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    redirect: init.redirect ?? 'follow',
    signal: AbortSignal.timeout(20_000),
    headers: { 'User-Agent': 'wemeditate-smoke' },
  })
  // 3xx responses (redirect: 'manual') have no useful body; guard the read.
  const html = res.status >= 300 && res.status < 400 ? '' : await res.text()

  return {
    status: res.status,
    finalUrl: res.url,
    location: res.headers.get('location'),
    contentType: res.headers.get('content-type') ?? '',
    html,
  }
}

/**
 * Error-page / error-boundary titles rendered by ErrorFallback + the _error
 * route. Copied verbatim from components/molecules/ErrorFallback/ErrorFallback.tsx
 * (TITLE_BY_TYPE). A real content page must contain none of these.
 */
export const ERROR_MARKERS = [
  'Service Temporarily Unavailable', // ErrorType.SERVER (500)
  'Content Not Found', // ErrorType.CLIENT (404)
  'Connection Issue', // ErrorType.NETWORK
  'Oops! Something went wrong', // ErrorType.UNKNOWN
] as const

/**
 * Assert the response is a real rendered HTML page: 200, text/html, has a
 * non-empty <title>, and shows none of the error-boundary titles.
 */
export function expectRenders(page: PageResult, path: string): void {
  expect(page.status, `${path} should return 200, got ${page.status}`).toBe(200)
  expect(page.contentType, `${path} should be HTML`).toContain('text/html')

  const title = page.html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()

  expect(title, `${path} should render a non-empty <title>`).toBeTruthy()

  for (const marker of ERROR_MARKERS) {
    expect(page.html.includes(marker), `${path} rendered the error page ("${marker}")`).toBe(false)
  }
}

/**
 * Assert the HTML has no broken internal links — i.e. links to "/undefined" or
 * "/null", which appear when a page relationship (e.g. a nav item) is fetched
 * without its slug resolved. Catches under-populated CMS reads that otherwise
 * render a 200 page with dead navigation.
 */
export function expectNoBrokenLinks(html: string, path: string): void {
  const broken = [
    ...new Set([...html.matchAll(/href="(\/(?:undefined|null)\b[^"]*)"/gi)].map((m) => m[1])),
  ]

  expect(
    broken,
    `${path} has broken internal links (unresolved slugs): ${broken.join(', ')}`,
  ).toEqual([])
}

/** Same-origin link paths found in the HTML (deduped, anchors/external dropped). */
export function internalLinks(html: string): string[] {
  const found = new Set<string>()

  for (const match of html.matchAll(/href="(\/[^"#]*)"/gi)) {
    const href = match[1]

    if (href.startsWith('//')) continue // protocol-relative = external
    found.add(href.replace(/\/$/, '') || '/')
  }

  return [...found]
}

/** Parse the document <head> for SEO assertions (used by the #24 page renderer). */
export function headTags(html: string): {
  title: string | null
  description: string | null
  ogImage: string | null
} {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html
  const meta = (re: RegExp) => head.match(re)?.[1]?.trim() ?? null

  return {
    title: meta(/<title[^>]*>([^<]*)<\/title>/i),
    description: meta(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i),
    ogImage: meta(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i),
  }
}

export interface CmsSamples {
  pageSlug: string | null
  meditationId: string | null
}

/**
 * Serialize nested params into PayloadCMS's qs bracket format, e.g.
 * { select: { meta: { title: true } } } → "select[meta][title]=true".
 */
function toQueryString(params: Record<string, unknown>, prefix = ''): string {
  return Object.entries(params)
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}[${key}]` : key

      return value !== null && typeof value === 'object'
        ? toQueryString(value as Record<string, unknown>, path)
        : `${encodeURIComponent(path)}=${encodeURIComponent(String(value))}`
    })
    .join('&')
}

// The CMS enforces select/populate on collection reads via a query-validation
// hook (PR #23), so bare queries 400. Mirror the shapes cms-client.ts uses.
const PAGE_SELECT = {
  title: true,
  slug: true,
  _status: true,
  meta: { title: true, description: true, image: true },
}
const MEDITATION_SELECT = { title: true, thumbnail: true, _status: true }
const IMAGE_POPULATE = {
  images: { url: true, filename: true, alt: true, width: true, height: true },
}

/**
 * Optionally pull deterministic sample content from the production CMS so
 * ID-specific specs (meditations, lectures) always have a target. Requires the
 * SAHAJCLOUD_API_KEY secret; returns null when it's absent so callers test.skip.
 */
export async function discoverFromCms(): Promise<CmsSamples | null> {
  const apiKey = process.env.SAHAJCLOUD_API_KEY

  if (!apiKey) return null

  const base = (process.env.PUBLIC__SAHAJCLOUD_URL ?? 'https://cloud.sydevelopers.com').replace(
    /\/$/,
    '',
  )
  const headers = { Authorization: `clients API-Key ${apiKey}` }

  const firstDoc = async (path: string): Promise<Record<string, unknown> | null> => {
    const collection = path.split('?')[0]

    try {
      const res = await fetch(`${base}/api/${path}`, {
        headers,
        signal: AbortSignal.timeout(15_000),
      })

      // Log why discovery found nothing so a silent skip is diagnosable in CI
      // (e.g. 403 = unauthorized key vs. 0 docs = no published content).
      if (!res.ok) {
        console.warn(`[discoverFromCms] GET /api/${collection} → HTTP ${res.status}`)

        return null
      }
      const body = (await res.json()) as { docs?: Record<string, unknown>[] }
      const doc = body.docs?.[0] ?? null

      if (!doc) console.warn(`[discoverFromCms] GET /api/${collection} → 0 docs`)

      return doc
    } catch (err) {
      console.warn(`[discoverFromCms] GET /api/${collection} → ${(err as Error).message}`)

      return null
    }
  }

  const pageQuery = toQueryString({
    limit: 1,
    depth: 2,
    where: { _status: { equals: 'published' } },
    select: PAGE_SELECT,
    populate: IMAGE_POPULATE,
  })
  const meditationQuery = toQueryString({
    limit: 1,
    depth: 2,
    where: { _status: { equals: 'published' } },
    select: MEDITATION_SELECT,
    populate: IMAGE_POPULATE,
  })
  const page = await firstDoc(`pages?${pageQuery}`)
  const meditation = await firstDoc(`meditations?${meditationQuery}`)

  return {
    pageSlug: typeof page?.slug === 'string' ? page.slug : null,
    meditationId: meditation?.id != null ? String(meditation.id) : null,
  }
}
