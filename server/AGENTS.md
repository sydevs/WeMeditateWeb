# CMS API-client reads (`server/cms-client.ts`)

The SahajCloud (PayloadCMS) API validates every API-client read. Follow these rules.

## Always send `select`, `populate` at depth > 1, and `locale`

- **`select`** is required on collection reads. Without it, the API returns **HTTP 400**, not
  403. See [local-environment](../docs/local-environment.md) for the 400-vs-403 difference.
- **`populate`** is required whenever `depth > 1`. It returns the fields of a populated
  relationship. Without it, the API returns a related document with missing fields (for example
  `title` or `slug`), which renders empty content and dead links.
- **`locale`** is required for localized content. `title` and `slug` are localized fields, and
  without a locale they may not resolve. Pass `locale` from the caller (`pageContext.locale`).
  See `getWebConfig({ locale })` and its callers under `pages/**/+data.ts`.
- Type the `select`/`populate` constants against the generated `*Select` interfaces
  (`PagesSelect`, `WmWebConfigSelect`, …), so a schema change becomes a compile error, not a
  runtime 400. See `PAGE_SELECT`, `WEB_CONFIG_SELECT`, and `WEB_CONFIG_POPULATE` in
  `server/cms-client.ts`.

## Treat a bare id as unpublished — degrade, do not break

A published page populates into an object. The API returns an unpublished or trashed page as a
bare numeric id instead. Rendering that id as a link produces a dead `/undefined`.

- Filter relationship arrays down to populated objects with a non-empty slug, before you build
  any links. See `partitionPublishedPages` in `server/cms-client.ts`.
- When you drop a reference, log a Sentry warning (`level: 'warning'`) that lists what you
  dropped. This keeps the CMS data gap visible. Do not hide it silently, and do not throw a 500.

## Custom root endpoints are not collection reads

`GET /api/atlas/seo` and the `related-*` endpoints belong to no collection, so the Payload SDK
cannot express them. They use plain `fetch` calls with an `Authorization: clients API-Key`
header, and shape their own response. `select` and `populate` do not apply here.

Two rules still apply:

- **Cache the response, and degrade on failure.** Wrap the call in `withCache` and catch errors.
  See `getAtlasSeo` in `server/atlas-client.ts`.
  ⚠ `withCache` reads a stored `null` as a cache miss. It fetches a `null` answer (a 404) again on
  every request. This is fine for rare paths. Do not rely on it to absorb real load.
- **Role gating is real.** The atlas endpoints need the `sahaj-atlas-client` role. Production has
  this role. The local client does not, so these endpoints return 403 locally, even with a valid
  key. Treat a refusal as "render without this data," never as a 500. See
  [local-environment](../docs/local-environment.md).

A read whose *response type* is hand-mirrored from SahajCloud (for example
`server/atlas-types.ts`, mirroring its `responseTypes.ts`) is not covered by `pnpm types:cms`,
which generates collection types only. Render these fields defensively: a missing field should
degrade, not throw.
