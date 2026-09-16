# Caching CMS reads

## The edge is the cache

A Worker's `fetch()` to a hostname on a **different** Cloudflare zone
[reads through that zone's cache](https://developers.cloudflare.com/workers/reference/how-the-cache-works/).
Every read in [cms-client.ts](./cms-client.ts) and [content-index.ts](./content-index.ts) goes to
`cloud.sydevelopers.com`, so that is exactly what they do. SahajCloud sets `s-maxage=600` and a
`Cache-Tag` on each cacheable path, and purges the tag on **every write**, so an editor's save
reaches this site within the edge TTL.

There is no second cache in front of these reads, and that is the point. A tag purge cannot reach
another Worker's KV, so a KV copy here would be a cache nobody could invalidate (#98). The cost
paid for that is a Railway round trip every 600s per colo, instead of once per TTL globally.

Two things follow for anyone adding a read:

- **A new slug caches only once SahajCloud's Cache Rule covers its path.** The rule enumerates
  paths with `eq`/`starts_with` — see `DEPLOYMENT.md` in `sydevs/SahajCloud`. A path outside it is
  `DYNAMIC` at the edge, which means no cache at all, not a slower one.
- **Nothing in this repo needs a TTL, a cache key, or a purge step.** Add the query function and
  stop. `docs/rules/rest-api.md` shows the shape.

## Retry, which is not caching

`readCms` in [cms-client.ts](./cms-client.ts) wraps a public read in `withRetry`
([error-utils.ts](./error-utils.ts)): three attempts, exponential backoff with jitter, network and
5xx errors only. A **preview** read skips it deliberately — an editor watching their own edit needs
the error now, not after about 7s of backoff.

`content-index.ts` needs no wrapper. `fetchContentIndexDocs` degrades to `[]` and reports to
Sentry, so nothing throws past it.

## What still uses KV

Three reads keep the read-through layer in [kv-cache.ts](./kv-cache.ts), bound as
`WEMEDITATE_CACHE` in [wrangler.toml](../wrangler.toml):

| Function | File | TTL |
| --- | --- | --- |
| `getAtlasSeo()` | [atlas-client.ts](./atlas-client.ts) | `AtlasCacheTTL.EVENT` 900s / `AtlasCacheTTL.REGION` 3600s |
| `getAtlasSitemapUrls()` | [atlas-client.ts](./atlas-client.ts) | `AtlasCacheTTL.REGION` |
| `getContentSitemapUrls()` | [sitemap-routes.ts](./sitemap-routes.ts) | `CacheTTL.LIST` |

⚠ **These carry the same no-invalidation problem the CMS reads just shed.** #98 held them back on
purpose: `getAtlasSeo`'s 900s event window is *longer* than the edge's 600s, so dropping its KV
shortens the window rather than only removing a stale read, and that trade needs its own argument.
Until that argument is made, an atlas edit is visible here only when the entry expires.

`withCache` details that still apply to those three:

- KV arrives through `getCmsContext()`. A caller passes no namespace, and there is none under
  `pnpm dev`, so local reads always miss.
- A read or write error never fails the request — `kv-cache.ts` logs to console and Sentry and
  continues uncached.
- **A stored `null` reads back as a miss.** A `null` answer is therefore re-fetched on every
  request. Fine for a dead atlas route; never rely on it to absorb load.
- **Change the cached shape, change the key prefix.** `getCachedResponse` returns stored JSON with
  no shape check, so a deploy that changes what a key holds hands the new code an old value for a
  whole TTL. `/sitemap.xml` hit this: `content-sitemap` held a `SitemapUrl[]` and came to hold
  `{ pages, meditations, lectures }`, which would have emptied the sitemap for 30 minutes per
  origin. Renaming it to `content-sitemap-docs` let the stale entries expire unread.

### Inspecting the remaining entries

Run these against the preview namespace during development. Drop `--preview` for production.

```bash
pnpm wrangler kv key list --binding WEMEDITATE_CACHE --preview
pnpm wrangler kv key get "atlas-seo:locale=en:target=region:london" --binding WEMEDITATE_CACHE --preview
pnpm wrangler kv key delete "atlas-seo:locale=en:target=region:london" --binding WEMEDITATE_CACHE --preview
```

Entries expire by TTL on their own. Delete one only when you need a content change visible
immediately.
