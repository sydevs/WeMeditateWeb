# SahajCloud reads (`server/sahajcloud/`)

The SahajCloud (PayloadCMS) API validates every API-client read. Follow these rules. Import a
read from `@/server/sahajcloud` (its `index.ts`), never from a file inside it.

## Always send `select`, `populate` at depth > 1, and `locale`

- **`select`** is required on collection reads. Without it, the API returns **HTTP 400**, not
  403. See [local-environment](../../docs/local-environment.md) for the 400-vs-403 difference.
- **`populate`** is required whenever `depth > 1`. Without it, the API returns **HTTP 400**, the
  same as a missing `select`. Each entry also restricts a populated relationship to the fields it
  lists: a field left out (for example `title` or `slug`) comes back missing, which renders empty
  content and dead links.
- **`locale`** is required for localized content. `title` is localized, and without a locale it
  may not resolve. **`slug` is not localized upstream**, which is why one path serves every locale
  and carries the whole `hreflang` cluster (`lib/seo/hreflang.ts`), and why the sitemap's
  `locale: 'all'` read gets a plain string back. Pass `locale` from the caller
  (`pageContext.locale`). See `getWebConfig({ locale })` and its callers under
  `pages/**/+data.ts`.
- Type the `select`/`populate` constants against the generated `*Select` interfaces
  (`PagesSelect`, `WmWebConfigSelect`, …), so a schema change becomes a compile error, not a
  runtime 400. See `PAGE_SELECT`, `WEB_CONFIG_SELECT`, and `WEB_CONFIG_POPULATE` in
  [selects.ts](selects.ts).
- ⚠ **Return the shape the `select` asked for, never the generated document.** A read narrowed
  to four fields that hands back a `Page` lets every consumer typecheck `page.content` and read
  `undefined` at runtime. Pair the narrow type with a select type derived from it, so neither can
  drift — the pairs in [types/sahajcloud.ts](../../types/sahajcloud.ts) are the pattern.

## Treat a bare id as unpublished — degrade, do not break

A published page populates into an object. The API returns an unpublished or trashed page as a
bare numeric id instead. Rendering that id as a link produces a dead `/undefined`.

- Filter relationship arrays down to populated objects with a non-empty slug, before you build
  any links. See `partitionPublishedPages` in [web-config.ts](web-config.ts).
- When you drop a reference, log a Sentry warning (`level: 'warning'`) that lists what you
  dropped. This keeps the SahajCloud data gap visible. Do not hide it silently, and do not throw
  a 500.
- ⚠ **A warning on a read is on the hot path, so bound its volume.** These reads run per render and
  nothing here caches them, and a gap this warning catches stands until an editor fixes the data —
  so a bare `captureMessage` bills the Sentry quota per page view. Send one event per distinct gap
  per isolate, and keep `console.warn` on every request. `warnOnce` in
  [error-utils.ts](../error-utils.ts) is that bound, and every warning here goes through it: it
  memoises per `source`, so one reader's churn re-arms no other's. A report Sentry sends at
  another level widens `warnOnce` rather than bypassing it. Lower the volume, never the
  level: a warning nobody can afford to leave on gets turned off, and then the gap is invisible
  again.

## Custom root endpoints are not collection reads

`GET /api/atlas/seo`, `GET /api/atlas/sitemap`, the `related-*` endpoints, and a content-index
block's computed endpoint belong to no collection, so the Payload SDK cannot express them. Every
one reads through `sahajCloudFetch` ([fetch.ts](fetch.ts)), which sends
the API key, logs the request the debugging workflow reads, and dumps SahajCloud's error body on a
non-OK response. Hand it a path, never a URL — it refuses anything that is not site-relative, so a
computed endpoint cannot move the request off the SahajCloud origin — and type the body yourself.
`select` and `populate` do not apply here.

⚠ **Never call `fetch` for SahajCloud directly.** `fetchWithErrorDetails` under both the SDK and
`sahajCloudFetch` is what bounds every call; a raw `fetch` has no limit at all. A write gets a
longer bound than a read (`fetch.ts` holds both): a visitor waits on a read, while an
abandoned write may already have landed upstream and the visitor resubmits.

⚠ **`GET /api/atlas/sitemap` is scoped to the calling key's client.** It answers with the atlas
URLs that client owns, resolved by SahajCloud's nearest-ancestor ownership walk, so
`getAtlasSitemapUrls` must never go back to reading `regions` and `events` and filtering them
here (#123). **An empty `urls` list is an answer, not a failure**: a client that owns no subtree
legitimately has nothing to list.

Three rules still apply:

- **Degrade on failure, through `degrade`** ([error-utils.ts](../error-utils.ts)): render without
  the data, and report the failure once per key per isolate. Key it on a small set (an id, an
  origin), never on the visitor's URL: `getAtlasSeo` passes no key, so a site-wide 403 is one
  event, not one per crawled route. See `getAtlasSeo` in `server/sahajcloud/atlas.ts`.
  ⚠ Nothing in this repo caches a read. [CACHING.md](../CACHING.md) says what does.
  A read that degrades silently still needs `withRetry`, which the cache used to supply.
  `fetchContentIndexDocs` is the one read still missing it (#128).
- **Never branch on a status. Pick the reader that matches the read.** This is the rule for
  `sahajCloudFetch`'s callers. The SDK has no such pair, so `getDocumentById` reads the status
  itself — through `readStatus`, the one place a status is read off an error — to answer an
  unknown id with `null`. `sahajCloudFetch` throws a
  `SahajCloudResponseError` on every non-OK response. `sahajCloudFetchOptional` is the same read
  where a 404 is an answer — an unknown id, a stale inbound link, no songs route — and resolves to
  `null` instead, so that case never spends the retry ladder, never reaches Sentry, and is logged
  without a body dump. A read where a 404 is a data gap, not an answer, takes `sahajCloudFetch`.
  The status rides on the error because `detectErrorType` reads it structurally, and its message
  fallback recognises only 50x phrasing: a plain `Error` therefore classifies a Cloudflare-origin
  52x as UNKNOWN, and `withRetry` then refuses the one shape a Railway restart behind the edge
  produces.
- **Role gating is real.** The atlas endpoints need the `sahaj-atlas-client` role. Production has
  this role. The local client does not, so these endpoints return 403 locally, even with a valid
  key. Treat a refusal as "render without this data," never as a 500. See
  [local-environment](../../docs/local-environment.md).

A read whose *response type* is hand-mirrored from SahajCloud (for example
`types/atlas.ts`, mirroring its `responseTypes.ts`) is not covered by `pnpm types:cms`,
which generates only the collection, global and block schema. Render these fields defensively:
a missing field should degrade, not throw.

## `locale=all` returns a per-locale map, not a value

A read with `locale: 'all'` returns every **localized** field as
`{ locale: value }`, and every unlocalized field as a plain value. So a read that needs one
document in one language must never use it — every consumer of `Page` would have to unpick the
maps.

Use it only for a locale-agnostic fact. Today there is one: which locales a page is published in.
`pages` opts into Payload's `versions.drafts.localizeStatus` upstream (SahajCloud#718), so
`?locale=all&select[_status]=true` answers that in a single query. `lib/seo/hreflang.ts` turns the map
into a locale list, and `getPageLocaleStatus` in [pages.ts](pages.ts) is the only
single-document read that sends `all`.

Three things follow, all load-bearing:

- **It is a second read, beside the content read, not a replacement for it.** It sends no locale,
  so every locale of a page issues the same URL and shares one edge entry.
- **It returns `{}`, never `null`, and never retries.** `advertisedLocales` walks the map either
  way, and the page content is already in hand when this read fails, so the default retry backoff
  would stall TTFB to decorate a `<head>`.
- **Only `pages` (and `app-cards`) carry the map.** `meditations` returns `_status` as a plain
  string and `lectures` omits it. Neither makes a per-locale claim, and
  `advertisedLocales` returns an empty list for both rather than guessing.

The API also enforces this: a read at a locale the page is not published in returns **zero docs**,
not a fallback copy. So a page always renders in a locale it is published in, and its canonical is
always self-referential.
