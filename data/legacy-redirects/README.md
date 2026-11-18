# Legacy redirect map

Where an address on the retired Rails site (`sydevs/WeMeditate`, wemeditate.com until the cutover in
sydevs/WeMeditateWeb#160) lands on this site. `server/legacy-redirects.ts` consults the map only for a
request that would otherwise 404, and 301s to the answer.

| File | What it is | Produced by |
| --- | --- | --- |
| `legacy-inventory.json` | The old site's public URL inventory: slugs, titles, ids, languages, state, slug history | `pnpm redirects:export-inventory` (needs the Heroku CLI) |
| `legacy-routes.json` | The translated path words of each language, from the old app's `config/locales/*.yml` | `pnpm redirects:extract-routes <checkout> <published-locales>` |
| `new-site.json` | The pages and meditations SahajCloud serves, with each page's published languages | `pnpm redirects:fetch-new-site` |
| `COVERAGE.md` | Counts per kind and language, every section fallback, every judgement match | `pnpm redirects:generate` |
| `../../lib/legacy-redirects/map.generated.json` | The map the Worker imports | `pnpm redirects:generate` |

The inventory carries no user data and no content. A row is exported only when it has been published at some
point (`state` 2, 3 or 4, or a category that is or was published), so a never-published draft's address and
title are not here. A title is a public title.

## Regenerate

```bash
# 1. Refresh whichever snapshot is stale (each overwrites its file in this folder).
pnpm redirects:export-inventory                    # old database, read-only
pnpm redirects:extract-routes <path-to-WeMeditate> "$(heroku config:get PUBLISHED_LOCALES -a wemeditate)"  # checkout files are only read
PUBLIC__SAHAJCLOUD_URL=https://cloud.sydevelopers.com SAHAJCLOUD_API_KEY=... pnpm redirects:fetch-new-site

# 2. Rebuild the map and the coverage report. Offline and deterministic.
pnpm redirects:generate
```

`scripts/legacy-redirects/build.test.ts` fails when `map.generated.json` is not what the snapshots
produce, so a stale map cannot merge. Publishing a page in another language changes `new-site.json` and so the
map; re-fetch and regenerate then.

## How an old address finds its page

1. The path is split, percent-decoded, NFC-normalised and lower-cased. The first segment is an old language
   prefix when it is one of the old site's 21 (`/pt-br`, `/tr`, `/en-au` …).
2. A section or fixed-page word (`méditations`, `musique`, `live`) is read per language from
   `legacy-routes.json`; the English word is accepted in every language.
3. A record's address (`/articles/<slug>`, `/techniques/<slug>`, `/subtle-system/<slug>`, `/live/<slug>`,
   `/inspiration/<category>`, `/meditations/<slug>`, and a root `/<slug>` for a promo page or event) is looked
   up in `exact`, which holds every current slug and every slug-history slug of each language.
4. A record maps to a new page by, in order: the English slug equal to a new page's slug; an English
   slug-history slug equal to one; the normalised English title equal to one. A record in another language maps
   through its id to its English row. More than one page matching is reported, never guessed.
5. The target is the page in the old address's language when the page is published there and the language is
   one of the ten launch languages; otherwise the English page. A record with no page lands on its nearest
   section (articles and categories: `/inspiration`; meditations: `/meditate-now`; techniques:
   `/techniques`; subtle system: `/chakras-channels`; streams: `/live-meditations`; anything else: home),
   in the same way.

An address the old site never had returns `null`: the map is built from the records, so an unknown slug stays a 404.

## The queries

`../../scripts/legacy-redirects/queries.ts` holds all ten, one named export per table. Each is a
SELECT, wrapped in `select row_to_json(t) from (<query>) t` and run through
`heroku pg:psql -a wemeditate`, which `pnpm redirects:export-inventory` does for you.
