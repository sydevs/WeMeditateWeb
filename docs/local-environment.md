---
description: Local environment gotchas — CMS API key (403 vs 400) and getWebConfig caching.
globs:
  - "**"
alwaysApply: false
---

# Local environment notes

## `SAHAJCLOUD_API_KEY`: 403 means a stale key, not an origin block

`.env.local`'s `SAHAJCLOUD_API_KEY` must be a valid production key. When local CMS access fails:

- **403 Forbidden** on a CMS read (the page 500s locally, and the dev log shows
  `[PayloadCMS] … → 403`) means the local key is stale or invalid. Refresh it. This is not an
  origin or IP block — the request reaches Payload's access control and fails there.
- A valid key returns **400** on a malformed query (a missing `select`, or `depth > 1` without
  `populate` — see [cms-api-reads](../server/AGENTS.md)). So 400 means authenticated but a bad
  query. 403 means not authenticated.
- The deployed Worker uses its own key, set in the Cloudflare dashboard, independent of
  `.env.local`. The deploy can serve CMS content even while local access 403s. When the local key
  will not work, verify against the deployed preview through CI instead.

### The exception: a 403 that is not a stale key

`.env.local`'s key belongs to a different client record than production's, and that record holds
fewer roles.

| | production | local |
| --- | --- | --- |
| record | id 1, `We Meditate Web` | id 3, `We Meditate Web (LOCAL)` |
| roles | `wemeditate-web-client` + `sahaj-atlas-client` | `wemeditate-web-client` only |

So the atlas surface 403s locally by design, even with a valid key. `GET /api/atlas/seo`,
`/api/regions`, and `/api/events` all refuse. `/api/pages` returns 200 on the same key.
Verify which case applies with `GET /api/clients/me` — it returns the record and its roles —
before you rotate a key that is not the problem. Tracked in sydevs/WeMeditateWeb#62.

## `getWebConfig` is not KV-cached

`getWebConfig()` calls `withCache` without a `kv` binding, so it fetches fresh from the CMS on
every request. Nothing goes stale here. Newly published CMS content appears immediately on the
deploy.

## The dev server can serve stale modules

`pnpm dev` (Vike/Vite) sometimes serves a stale module or render after an edit. For example, a
request that makes zero CMS calls can still render the old nav. For a data-layer change, prefer
a unit test plus CI verification over trusting one dev-server probe. To restart cleanly:
`lsof -ti:5173 | xargs kill -9 && pnpm dev`.
