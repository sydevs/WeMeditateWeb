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

         return validateSDKResponse(result.docs[0], `getNewContent(${options.slug})`)
       },
     })
   }
   ```

## Update PayloadCMS types

Run this command when the CMS schema changes:
```bash
pnpm types:cms
```
It downloads the latest `payload-types.ts` from SahajCloud.

## API authentication

Every REST API request needs an `Authorization: clients API-Key {apiKey}` header. The SDK client
factory adds this header for you.
