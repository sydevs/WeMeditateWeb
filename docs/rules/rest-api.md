---
paths:
  - "server/sahajcloud-client.ts"
  - "server/content-types.ts"
  - "server/payload-client.ts"
  - "server/atlas-client.ts"
---

# Working with the REST API

## Add a new query function

1. Define or import TypeScript types from [server/payload-types.ts](../../server/payload-types.ts).
2. Add app-specific types to [server/content-types.ts](../../server/content-types.ts) if needed.
3. Add the query function to [server/sahajcloud-client.ts](../../server/sahajcloud-client.ts):
   ```typescript
   export async function getNewContent(options: QueryOptions & { slug: string }) {
     return withRetryUnlessPreview(
       async () => {
         const client = createPayloadClient({ preview: options.preview === true })

         const result = await client.find({
           collection: 'content',
           where: { slug: { equals: options.slug } },
           locale: options.locale,
           depth: 2,
         })

         return result.docs[0] ?? null
       },
       { preview: options.preview === true },
     )
   }
   ```

   No cache key, no TTL, and no purge step. The Cloudflare edge in front of SahajCloud caches the
   subrequest for 600s — see [server/CACHING.md](../../server/CACHING.md), which also says why the
   purge on write is not a guarantee. A new path caches only once SahajCloud's Cache Rule covers
   it.

   `withRetryUnlessPreview` supplies the retry: three attempts for a public read, none for a
   preview read, which must fail fast. A read outside `sahajcloud-client.ts` has no preview
   variant and calls `withRetry` directly — see `getAtlasSeo`. Never leave one unwrapped because
   it degrades quietly; that is the case that needs it most. Let SDK errors propagate into it.
   `@payloadcms/sdk` throws a `PayloadSDKError`
   carrying the HTTP status, which [server/error-utils.ts](../../server/error-utils.ts)
   classifies. Return `null` (or an empty array) only for an empty result, never for a failure.

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

`WEB_TRANSLATIONS_SELECT` lives in [server/content-types.ts](../../server/content-types.ts), beside the
`WebTranslations` type that derives from it. Add a group there and it is both fetched and
typed. Listing the groups anywhere else lets the query and the type disagree.

[scripts/sync-translations.mjs](../../scripts/sync-translations.mjs) is the one exception, and it
cannot import that constant: it is plain node with no TypeScript loader. It keeps every response
key outside `NON_GROUP_KEYS`, so the snapshot mirrors groups the site never fetches. Those cost
bytes in `lib/translations.en.json` and nothing more — `WebTranslations` derives from the select,
so an unfetched group never becomes addressable through `useT()`.

## Translations are SahajCloud-owned

Every UI string comes from `wm-web-translations`, through `useT()`. See the "Translations are
SahajCloud-owned" section of [AGENTS.md](../../AGENTS.md) for the rule and
[scripts/sync-translations.mjs](../../scripts/sync-translations.mjs) for the snapshot.

Run `pnpm sync:translations` after the SahajCloud English copy changes, and commit the diff. It
needs both `PUBLIC__SAHAJCLOUD_URL` and `SAHAJCLOUD_API_KEY` in the shell, with no default origin,
and it prints the API client the key belongs to before writing — a snapshot silently taken from a
local SahajCloud would commit placeholder English. It is not run in CI.

## Update PayloadCMS types

Run this command when the SahajCloud schema changes:
```bash
pnpm types:cms
```
It downloads the latest `payload-types.ts` from SahajCloud.

## API authentication

Every REST API request needs an `Authorization: clients API-Key {apiKey}` header. The SDK client
factory adds this header for you, and
[server/sahajcloud-fetch.ts](../../server/sahajcloud-fetch.ts) adds it to every read of a custom
root endpoint. Nothing else composes that header.

## A public write is a proxy, not a query function

Contact and subscribe submissions do not go through `sahajcloud-client.ts`. They post to the
same-origin `POST /api/submissions`, which forwards one create to SahajCloud's `user-submissions`
collection — the captcha header, the refusal envelope, and why the browser cannot make the call
itself all live in [server/AGENTS.md](../../server/AGENTS.md). Nothing here is cached: a
submission is a write.
