---
paths:
  - "server/cms-client.ts"
  - "server/cms-types.ts"
  - "server/payload-client.ts"
  - "server/atlas-client.ts"
---

# Working with the REST API

## Add a new query function

1. Define or import TypeScript types from [server/payload-types.ts](../../server/payload-types.ts).
2. Add app-specific types to [server/cms-types.ts](../../server/cms-types.ts) if needed.
3. Add the query function to [server/cms-client.ts](../../server/cms-client.ts):
   ```typescript
   export async function getNewContent(options: QueryOptions & { slug: string }) {
     return withCache({
       cacheKey: generateCacheKey('new-content', { slug: options.slug, locale: options.locale }),
       ttl: CacheTTL.PAGE,
       kv: options.kv,
       bypassCache: options.preview === true,
       fetchFn: async () => {
         const client = createPayloadClient({
           apiKey: options.apiKey,
           baseURL: options.baseURL,
           preview: options.preview === true,
         })

         const result = await client.find({
           collection: 'content',
           where: { slug: { equals: options.slug } },
           locale: options.locale,
           depth: 2,
         })

         return result.docs[0] ?? null
       },
     })
   }
   ```

   Let SDK errors propagate. `@payloadcms/sdk` throws a `PayloadSDKError` carrying the HTTP
   status, which [server/error-utils.ts](../../server/error-utils.ts) classifies and retries.
   Return `null` (or an empty array) only for an empty result, never for a failure.

## Read a global, and share it across the request

A global (`wm-web-config`, `wm-web-translations`) is read by almost every page, so reading it
per call site multiplies the per-request work. Go through
[server/site-context.ts](../../server/site-context.ts) instead:

```typescript
const { settings, translations } = await loadSiteContext(pageContext)
```

`loadSiteContext` fetches both in parallel, memoizes the promise on the `pageContext` object, and
404s a URL whose locale is not in `settings.availableLocales`. Adding a third global means adding
it there, not adding a seventh call site. `server/api-routes.ts` is the exception — it has no
`pageContext` — and calls `getWebConfig` directly.

A global still needs a typed `select`, like a collection read. `findGlobal` takes no `where`, and
takes `populate` only when it has relationships to resolve (`WEB_TRANSLATIONS_SELECT` reads at
`depth: 0`, because its groups are plain strings).

## Translations are CMS-owned

Every UI string comes from `wm-web-translations`, through `useT()`. See the "Translations are
CMS-owned" section of [AGENTS.md](../../AGENTS.md) for the rule and
[scripts/sync-translations.mjs](../../scripts/sync-translations.mjs) for the snapshot.

Run `pnpm sync:translations` after the CMS English copy changes, and commit the diff. It needs
both `PUBLIC__SAHAJCLOUD_URL` and `SAHAJCLOUD_API_KEY` in the shell, with no default origin, and
it prints the API client the key belongs to before writing — a snapshot silently taken from a
local CMS would commit placeholder English. It is not run in CI.

## Update PayloadCMS types

Run this command when the CMS schema changes:
```bash
pnpm types:cms
```
It downloads the latest `payload-types.ts` from SahajCloud.

## API authentication

Every REST API request needs an `Authorization: clients API-Key {apiKey}` header. The SDK client
factory adds this header for you.
