---
description: Required query params and graceful handling for PayloadCMS API-client reads.
globs:
  - "server/**"
alwaysApply: false
---

# CMS API-client reads (`server/cms-client.ts`)

The SahajCloud (PayloadCMS) API enforces a query-validation hook on API-client reads. Follow these rules for every read.

## Always pass `select` (+ `populate` at `depth > 1`) and `locale`

- **`select`** is required on collection reads. Omitting it returns **HTTP 400** (not 403 — see [local-environment](../docs/local-environment.md) for the 400-vs-403 distinction).
- **`populate`** is required whenever **`depth > 1`**, to return the fields of populated relationships. Without it, related docs come back missing fields (e.g. `title`/`slug` absent), which renders empty content and dead links.
- **`locale`** must be passed for localized content. `title` and `slug` are localized — without a locale they may not resolve. Thread `locale` from the caller (`pageContext.locale`); see `getWebConfig({ locale })` and its callers under `pages/**/+data.ts`.
- Type the `select`/`populate` constants against the generated `*Select` interfaces (`PagesSelect`, `WmWebConfigSelect`, …) so a CMS schema change surfaces as a compile error rather than a runtime 400. See `PAGE_SELECT`, `WEB_CONFIG_SELECT`, `WEB_CONFIG_POPULATE` in `server/cms-client.ts`.

## Treat bare-ID relationships as unpublished — degrade, don't break

A published page populates into an object; an **unpublished/trashed** one comes back as a **bare numeric id**. Rendering one as a link produces a dead `/undefined`.

- Filter relationship arrays to populated objects **with a non-empty slug** before building links (see `partitionPublishedPages` in `server/cms-client.ts`).
- When dropping refs, log a **Sentry warning** (`level: 'warning'`) listing what was dropped, so the CMS data gap stays visible. Do **not** silently hide it, and do **not** throw a 500.
