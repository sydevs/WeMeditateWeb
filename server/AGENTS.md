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

- **Degrade on failure.** Catch errors and render without the data. See `getAtlasSeo` in
  `server/atlas-client.ts`.
  ⚠ Nothing in this repo caches a read. [CACHING.md](./CACHING.md) says what does.
  A read that degrades silently still needs `withRetry`, which the cache used to supply.
- **Role gating is real.** The atlas endpoints need the `sahaj-atlas-client` role. Production has
  this role. The local client does not, so these endpoints return 403 locally, even with a valid
  key. Treat a refusal as "render without this data," never as a 500. See
  [local-environment](../docs/local-environment.md).

A read whose *response type* is hand-mirrored from SahajCloud (for example
`server/atlas-types.ts`, mirroring its `responseTypes.ts`) is not covered by `pnpm types:cms`,
which generates collection types only. Render these fields defensively: a missing field should
degrade, not throw.

## `locale=all` returns a per-locale map, not a value

A read with `locale: 'all'` returns every **localized** field as
`{ locale: value }`, and every unlocalized field as a plain value. So a read that needs one
document in one language must never use it — every consumer of `Page` would have to unpick the
maps.

Use it only for a locale-agnostic fact. Today there is one: which locales a page is published in.
`pages` opts into Payload's `versions.drafts.localizeStatus` upstream (SahajCloud#718), so
`?locale=all&select[_status]=true` answers that in a single query. `lib/hreflang.ts` turns the map
into a locale list, and `getPageLocaleStatus` in `server/cms-client.ts` is the only single-document
read that sends `all`.

Three things follow, all load-bearing:

- **It is a second read, beside the content read, not a replacement for it.** It sends no locale,
  so every locale of a page issues the same URL and shares one edge entry.
- **It returns `{}`, never `null`, and retries once.** `advertisedLocales` walks the map either
  way; and the page content is already in hand when this read fails, so the default 3-attempt
  backoff would stall TTFB to decorate a `<head>`.
- **Only `pages` (and `app-cards`) carry the map.** `meditations` returns `_status` as a plain
  string and `lectures` omits it. Neither makes a per-locale claim, and
  `advertisedLocales` returns an empty list for both rather than guessing.

The API also enforces this: a read at a locale the page is not published in returns **zero docs**,
not a fallback copy. So a page always renders in a locale it is published in, and its canonical is
always self-referential.
