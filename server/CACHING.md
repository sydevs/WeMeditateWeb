# REST API Caching with Cloudflare KV

This document explains how [cms-client.ts](./cms-client.ts) caches PayloadCMS REST reads in
Cloudflare KV.

## Overview

The app uses a read-through cache, in [kv-cache.ts](./kv-cache.ts). This cuts load on the
PayloadCMS backend, and speeds up responses.

## How it works

`withCache()` wraps a query function:

1. It checks the cache first, unless `bypassCache` is true.
2. On a cache miss, it runs the query function, with automatic retry.
3. It stores the result in the cache, unless `bypassCache` is true.
4. It returns the result.

KV comes from the request context automatically, through `getCmsContext()`. A caller does not
pass a KV namespace.

A cache-read or cache-write error never fails the request. `kv-cache.ts` logs the error to
console and Sentry, then continues without the cache.

## TTL table

| Constant | Seconds | Used for |
|---|---|---|
| `CacheTTL.PAGE` | 3600 (1 hour) | Pages |
| `CacheTTL.SETTINGS` | 86400 (24 hours) | The WebConfig global |
| `CacheTTL.LIST` | 1800 (30 minutes) | Tag-filtered lists, related content |
| `CacheTTL.MEDITATION` | 3600 (1 hour) | Meditations |
| `CacheTTL.LECTURE` | 3600 (1 hour) | Lectures |
| `CacheTTL.SONG` | 3600 (1 hour) | Songs, and meditation background music |

## Cache key format

`generateCacheKey(prefix, params)` builds `prefix:key1=val1:key2=val2`, with keys sorted
alphabetically. Examples:

```
page:locale=en:slug=home
web-config:locale=en
pages-by-tags:limit=100:locale=en:tags=lifestyle,wisdom
```

## Cached functions

Every function below lives in [cms-client.ts](./cms-client.ts), unless noted.

- `getPageBySlug()` — cached, `CacheTTL.PAGE`.
- `getDocumentById()` — cached per collection (`CacheTTL.PAGE`, `.MEDITATION`, or `.LECTURE`).
  Pass `preview: true` to skip the cache and fetch draft content.
- `getLecture()` — wraps `getDocumentById()`, and inherits its cache behavior.
- `getWebConfig()` — cached, `CacheTTL.SETTINGS`.
- `getPagesByTags()` — cached, `CacheTTL.LIST`.
- `getSongsByTags()` — cached, `CacheTTL.SONG`.
- `getMeditationSongs()` — cached, `CacheTTL.SONG`. Degrades to `[]` on failure.
- `getRelatedMeditations()` and `getRelatedLectures()` — cached, `CacheTTL.LIST`. Degrade to `[]`
  on failure.
- `getAtlasSeo()` and `getAtlasSitemapUrls()`, in [atlas-client.ts](./atlas-client.ts) — cached
  with their own TTLs (`AtlasCacheTTL`). See that file.

## Preview mode

Pass `preview: true` to `getDocumentById()` (and to `getLecture()`, which wraps it) to skip the
cache, and fetch draft content with trusted preview credentials:

```typescript
const previewPage = await getDocumentById({
  collection: 'pages',
  id: '123',
  locale: 'en',
  preview: true,
})
```

Preview mode also skips retry. An editor then sees an error immediately, instead of waiting
through several seconds of backoff.

## Managing the KV store with Wrangler

Run these commands against the preview namespace during development. Drop `--preview` for
production.

```bash
# List keys
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --preview

# Read one entry
pnpm wrangler kv key get "page:locale=en:slug=home" --binding WEMEDITATE_CACHE --preview

# Delete one entry
pnpm wrangler kv key delete "page:locale=en:slug=home" --binding WEMEDITATE_CACHE --preview

# Delete every entry (use with caution)
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --preview | \
  jq -r '.[].name' | xargs -I {} pnpm wrangler kv key delete {} --binding WEMEDITATE_CACHE --preview
```

Cache entries expire on their own, by TTL. Manual deletion is rarely needed: use it only right
after a content update you need to see immediately.

The KV namespace itself is configured in [wrangler.toml](../wrangler.toml), under
`[[kv_namespaces]]`, bound as `WEMEDITATE_CACHE`.

## Adjusting a TTL

Edit the `CacheTTL` constants in [kv-cache.ts](./kv-cache.ts).
