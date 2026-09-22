# Caching CMS reads

## The edge is the cache

A Worker's `fetch()` to a hostname on a **different** Cloudflare zone
[reads through that zone's cache](https://developers.cloudflare.com/workers/reference/how-the-cache-works/).
Every CMS read in this Worker goes to `cloud.sydevelopers.com`, so that is exactly what they do.
SahajCloud sets `s-maxage=600` and a `Cache-Tag` on each cacheable path, so an editor's save
reaches this site within 600s.

⚠ **The 600s TTL is the guarantee. The purge is not.** SahajCloud purges the `Cache-Tag` on write
only when `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_CACHE_PURGE_TOKEN` are set on its Railway service;
unset, every purge is a silent no-op and nothing warns (`DEPLOYMENT.md` §Edge Cache in
`sydevs/SahajCloud`). Quote 600s as the worst case for any read here, never "immediate".

There is no second cache anywhere in this repo, and that is the point. A tag purge cannot reach
another Worker's KV, so a KV copy here would be a cache nobody could invalidate (#98). The cost
paid for that is a Railway round trip every 600s per colo, instead of once per TTL globally.

Two things follow for anyone adding a read:

- **A new slug caches only once SahajCloud's Cache Rule covers its path.** The rule enumerates
  paths with `eq`/`starts_with` — see `DEPLOYMENT.md` in `sydevs/SahajCloud`. A path outside it is
  `DYNAMIC` at the edge, which means no cache at all, not a slower one.
- **Nothing in this repo needs a TTL, a cache key, or a purge step.** Add the query function and
  stop. `docs/rules/rest-api.md` shows the shape.

## Retry, which is not caching

`withRetry` ([error-utils.ts](./error-utils.ts)) is three attempts with exponential backoff and
jitter, on network and 5xx errors only. `withCache` used to run it on every miss, so every read it
wrapped keeps it now that the cache is gone.

`withRetryUnlessPreview` in [sahajcloud-client.ts](./sahajcloud-client.ts) adds the one exception: a **preview**
read skips the retry, because an editor watching their own edit needs the error now, not after
about 7s of backoff.

⚠ **A read that degrades silently needs the retry most, not least.** `getAtlasSeo` returns `null`
and both sitemap halves return `[]` on failure, in a response that still answers 200. Without the
retry, one upstream blip costs an atlas page its server-rendered half, or the sitemap a whole
section, with nothing in the output to say so. [atlas-client.ts](./atlas-client.ts) and
[sitemap-routes.ts](./sitemap-routes.ts) call `withRetry` directly for that reason, and their
tests pin the call.

`content-index.ts` needs no wrapper. `fetchContentIndexDocs` degrades to `[]` and reports to
Sentry, so nothing throws past it.

## The KV layer that used to sit here

`server/kv-cache.ts` and the `WEMEDITATE_CACHE` binding are gone (#98), and with them
`AtlasCacheTTL` and the `content-sitemap-docs` key prefix. `getAtlasSeo`, `getAtlasSitemapUrls`
and `getContentSitemapUrls` held out one round longer than the CMS reads; they read through the
edge now too.

Every window that removal touched got shorter, none longer: a region 3600s → 600s, a class
900s → 600s, the atlas sitemap 3600s → 600s, the content sitemap 1800s → 600s.

⚠ **This Worker now holds no persistent state at all.** There is no namespace to inspect, no key
to purge, and no `wrangler kv` step in any runbook here. To force a content change through, purge
the `Cache-Tag` upstream in SahajCloud.
