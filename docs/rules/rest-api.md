---
paths:
  - "server/cms-client.ts"
  - "server/cms-types.ts"
  - "server/payload-client.ts"
  - "server/atlas-client.ts"
---

# Working with REST API

## Adding New Query Functions

1. Define or import TypeScript types from [server/payload-types.ts](../../server/payload-types.ts)
2. Add app-specific types to [server/cms-types.ts](../../server/cms-types.ts) if needed
3. Add query function in [server/cms-client.ts](../../server/cms-client.ts):
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

         return validateSDKResponse(result.docs[0], `getNewContent(${options.slug})`)
       },
     })
   }
   ```

## Updating PayloadCMS Types

When the CMS schema changes, regenerate types:
```bash
pnpm types:cms
```

This downloads the latest `payload-types.ts` from SahajCloud.

## API Authentication

All REST API requests require authentication via `Authorization: clients API-Key {apiKey}` header. The SDK client factory handles this automatically.

