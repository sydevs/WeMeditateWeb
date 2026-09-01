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

## Custom root endpoints are not collection reads

`GET /api/atlas/seo` (and the `related-*` endpoints) belong to no collection, so the Payload SDK
cannot express them — they are plain `fetch` calls with the `Authorization: clients API-Key` header.
`select`/`populate` do not apply; the endpoint shapes its own response.

Two things still do:

- **Cache and degrade.** Wrap in `withCache` and catch — see `getAtlasSeo` in `server/atlas-client.ts`.
  ⚠ `withCache` reads a stored `null` back as a **cache miss**, so a `null` answer (a 404) is
  re-fetched every request. Fine for rare paths; don't rely on it to absorb load.
- **Role gating is real.** The atlas endpoints require the `sahaj-atlas-client` role, which the
  production client has and the local one does not — so they 403 in local dev with a valid key. Treat
  a refusal as "render without this data", never as a 500. See
  [local-environment](../docs/local-environment.md).

Collection reads whose *response type* is hand-mirrored from SahajCloud (e.g. `server/atlas-types.ts`,
mirroring its `responseTypes.ts`) are not covered by `pnpm types:cms`, which generates collections
only. Render them defensively — a field that silently stops being sent should degrade, not throw.
