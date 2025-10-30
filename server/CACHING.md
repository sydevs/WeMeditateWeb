# GraphQL Caching with Cloudflare KV

This document explains how GraphQL request caching works in the WeMeditate web application using Cloudflare KV.

## Overview

The application implements a **read-through cache pattern** for GraphQL queries using Cloudflare KV storage. This significantly reduces load on the PayloadCMS backend and improves response times for end users.

## Architecture

### Components

1. **Cache Utility** ([kv-cache.ts](./kv-cache.ts))
   - Core caching logic and utilities
   - Cache key generation
   - TTL management
   - Graceful degradation when KV is unavailable

2. **GraphQL Client** ([graphql-client.ts](./graphql-client.ts))
   - Wrapped query functions with caching
   - Automatic cache invalidation via TTL
   - Type-safe cache operations

3. **Type Definitions** ([../types/vike.d.ts](../types/vike.d.ts))
   - Cloudflare KV namespace types
   - PageContext extensions

## Cache Strategy

### TTL Configuration

Different content types have different cache durations:

| Content Type | TTL | Reason |
|-------------|-----|---------|
| Pages | 1 hour (3600s) | Frequently updated content |
| Web Settings | 24 hours (86400s) | Rarely updated global config |
| Lists (by tags) | 30 minutes (1800s) | Dynamic content |
| Meditations | 1 hour (3600s) | Semi-static content |
| Music | 1 hour (3600s) | Semi-static content |

### Cache Keys

Cache keys are automatically generated based on query parameters:

```
Format: prefix:param1=value1:param2=value2
Examples:
  - page:slug=home:locale=en
  - settings:
  - pages-by-tags:tagIds=tag1,tag2:locale=en:limit=20
```

## Usage

### In Data Functions

All GraphQL query functions accept an optional `kv` parameter:

```typescript
export async function data(pageContext: PageContextServer) {
  // Access KV namespace from Cloudflare Workers context
  const kv = pageContext.cloudflare?.env?.WEMEDITATE_CACHE

  // Automatically cached with 1 hour TTL
  const page = await getPageBySlug({
    slug: 'home',
    locale: 'en',
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    kv,  // Pass KV namespace for caching
  })

  return { page }
}
```

### Cached Functions

The following GraphQL query functions support caching:

- ✅ `getPageBySlug()` - Cached (1 hour)
- ✅ `getWeMeditateWebSettings()` - Cached (24 hours)
- ✅ `getMeditationById()` - Cached (1 hour)
- ✅ `getPagesByTags()` - Cached (30 minutes)
- ✅ `getMeditationsByTags()` - Cached (30 minutes)
- ✅ `getMusicByTags()` - Cached (1 hour)
- ❌ `getPageById()` - **NOT cached** (used for preview mode)

### Graceful Degradation

The caching layer is designed to **never fail requests**:

- If KV is unavailable, queries execute normally without caching
- If cache read fails, the query executes and attempts to cache the result
- If cache write fails, the query result is still returned successfully
- All cache errors are logged but not thrown

## Cache Management

### Development

During local development with Wrangler:

```bash
# View cache contents
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --preview

# Get a specific cache entry
pnpm wrangler kv key get "page:slug=home:locale=en" --binding WEMEDITATE_CACHE --preview

# Delete a cache entry
pnpm wrangler kv key delete "page:slug=home:locale=en" --binding WEMEDITATE_CACHE --preview

# Bulk delete (clear cache)
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --preview | jq -r '.[].name' | xargs -I {} pnpm wrangler kv key delete {} --binding WEMEDITATE_CACHE --preview
```

### Production

For production cache management:

```bash
# View production cache
pnpm wrangler kv key list --binding WEMEDITATE_CACHE

# Get production cache entry
pnpm wrangler kv key get "page:slug=home:locale=en" --binding WEMEDITATE_CACHE

# Delete production cache entry
pnpm wrangler kv key delete "page:slug=home:locale=en" --binding WEMEDITATE_CACHE

# Clear entire production cache (use with caution!)
pnpm wrangler kv key list --binding WEMEDITATE_CACHE | jq -r '.[].name' | xargs -I {} pnpm wrangler kv key delete {} --binding WEMEDITATE_CACHE
```

### Cache Invalidation Strategies

#### Automatic (TTL-based)

Cache entries automatically expire based on their TTL. No manual intervention required.

#### Manual Invalidation

When content is updated in PayloadCMS, you may want to manually invalidate specific cache entries:

```bash
# Invalidate a specific page
pnpm wrangler kv key delete "page:slug=home:locale=en" --binding WEMEDITATE_CACHE

# Invalidate settings
pnpm wrangler kv key delete "settings:" --binding WEMEDITATE_CACHE

# Invalidate all pages in a locale
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --prefix "page:" | \
  jq -r '.[].name' | grep "locale=en" | \
  xargs -I {} pnpm wrangler kv key delete {} --binding WEMEDITATE_CACHE
```

#### Webhook-based Invalidation (Future Enhancement)

For real-time cache invalidation, consider implementing PayloadCMS webhooks:

1. Add a webhook in PayloadCMS that triggers on content updates
2. Create a Cloudflare Worker endpoint to receive the webhook
3. Delete relevant cache entries based on the updated content type and ID

## Configuration

### KV Namespace Setup

The KV namespace is configured in [wrangler.toml](../wrangler.toml):

```toml
[[kv_namespaces]]
binding = "WEMEDITATE_CACHE"
id = "5c38f43ed50440a3bc7e06c8e9483856"
preview_id = "cf4eaa694eed4a7aa7f0482905e496a1"
```

To create a new KV namespace (if needed):

```bash
# Production namespace
pnpm wrangler kv namespace create "WEMEDITATE_CACHE"

# Preview namespace
pnpm wrangler kv namespace create "WEMEDITATE_CACHE" --preview
```

### Adjusting TTLs

To modify cache durations, edit the `CacheTTL` constants in [kv-cache.ts](./kv-cache.ts:12-20):

```typescript
export const CacheTTL = {
  PAGE: 3600,        // Change to desired seconds
  SETTINGS: 86400,
  LIST: 1800,
  MEDITATION: 3600,
  MUSIC: 3600,
} as const
```

## Monitoring

### Cache Hit Rate

To monitor cache effectiveness, you can add custom logging:

```typescript
// In kv-cache.ts getCachedResponse()
const cached = await kv.get(key, 'json')
if (cached) {
  console.log(`Cache HIT: ${key}`)
} else {
  console.log(`Cache MISS: ${key}`)
}
```

### Storage Usage

Check KV storage usage in the Cloudflare dashboard:
- Navigate to Workers & Pages > KV
- Select "WEMEDITATE_CACHE"
- View storage metrics and key count

## Best Practices

1. **Always pass KV namespace**: Ensure all data functions pass the KV namespace to query functions
2. **Monitor cache hit rates**: Track cache performance to optimize TTLs
3. **Be cautious with manual invalidation**: Excessive cache clearing can overload the backend
4. **Use preview namespace for testing**: Test cache behavior with preview namespace before production changes
5. **Log cache operations**: Add logging for debugging cache behavior

## Troubleshooting

### Cache not working

1. Verify KV namespace exists:
   ```bash
   pnpm wrangler kv namespace list
   ```

2. Check KV namespace binding in wrangler.toml matches your namespace ID

3. Ensure `cloudflare?.env?.WEMEDITATE_CACHE` is available in PageContext

### Stale data

1. Check if TTL is too long for your use case
2. Manually invalidate the specific cache entry
3. Consider reducing TTL for that content type

### Cache growing too large

1. Review cache key generation - ensure keys are normalized
2. Consider reducing TTLs to allow more frequent expiration
3. Monitor storage usage in Cloudflare dashboard

## Future Enhancements

- [ ] Implement webhook-based cache invalidation
- [ ] Add cache warming for critical pages
- [ ] Implement cache versioning for instant invalidation
- [ ] Add cache analytics and monitoring
- [ ] Support cache tags for bulk invalidation by category
