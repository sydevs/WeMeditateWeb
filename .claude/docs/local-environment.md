---
description: Local environment gotchas — CMS API key (403 vs 400) and getWebConfig caching.
globs:
  - "**"
alwaysApply: false
---

# Local environment notes

## `SAHAJCLOUD_API_KEY`: 403 means a stale key, not an origin block

`.env.local`'s `SAHAJCLOUD_API_KEY` must be a **valid production key**. When local CMS access fails:

- **403 Forbidden** on CMS reads (pages 500 locally; `[PayloadCMS] … → 403` in the dev log) ⇒ the local key is **stale/invalid** — refresh it. It is **not** an origin/IP block (the request reaches Payload's access control).
- A **valid** key returns **400** on a malformed query (missing `select`, or `depth > 1` without `populate` — see [cms-api-reads](../rules/cms-api-reads.md)). So: **400 = authenticated but bad query; 403 = not authenticated.**
- The **deployed Worker** uses its own key configured in the Cloudflare dashboard, independent of `.env.local` — the deploy can serve CMS content even when local 403s. When the local key is unusable, verify against the deployed preview via CI.

## `getWebConfig` is not KV-cached

`getWebConfig()` calls `withCache` **without** a `kv` binding, so it fetches fresh from the CMS on every request (no stale cache). Newly-published CMS content appears immediately on the deploy.

## The dev server can serve stale modules

`pnpm dev` (Vike/Vite) sometimes serves a stale module/render after edits — e.g. a request that makes **zero** CMS calls yet renders old nav. For data-layer changes, prefer a unit test + CI verification over trusting a single dev-server probe. Restart cleanly with `lsof -ti:5173 | xargs kill -9 && pnpm dev`.
