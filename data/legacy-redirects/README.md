# Legacy redirect map

Where an address on the retired Rails site (`sydevs/WeMeditate`, wemeditate.com until the cutover in
sydevs/WeMeditateWeb#160) lands on this site. The Worker consults the map only for a request that would
otherwise 404; wiring that lookup in is a separate ticket.

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

Every statement is a SELECT, run through `heroku pg:psql -a wemeditate` wrapped in
`select row_to_json(t) from (<query>) t`.

### articles

```sql
select t.article_id as id, a.category_id, a.article_type, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from article_translations t join articles a on a.id = t.article_id where t.state in (2,3,4) and t.slug is not null order by t.article_id, t.locale
```

### staticPages

```sql
select t.static_page_id as id, a.role, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from static_page_translations t join static_pages a on a.id = t.static_page_id where t.state in (2,3,4) and t.slug is not null order by t.static_page_id, t.locale
```

### meditations

```sql
select t.meditation_id as id, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at, (t.horizontal_vimeo_id is not null or t.vertical_vimeo_id is not null) as has_video from meditation_translations t where t.state in (2,3,4) and t.slug is not null order by t.meditation_id, t.locale
```

### treatments

```sql
select t.treatment_id as id, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from treatment_translations t where t.state in (2,3,4) and t.slug is not null order by t.treatment_id, t.locale
```

### subtleSystemNodes

```sql
select t.subtle_system_node_id as id, a.role, t.locale, t.slug, t.name, t.state, t.published_at::date as published_at from subtle_system_node_translations t join subtle_system_nodes a on a.id = t.subtle_system_node_id where t.state in (2,3,4) and t.slug is not null order by t.subtle_system_node_id, t.locale
```

### categories

```sql
select t.category_id as id, t.locale, t.slug, t.name, t.published, t.published_at::date as published_at from category_translations t where (t.published or t.published_at is not null) and t.slug is not null order by t.category_id, t.locale
```

### streams

```sql
select id, locale, slug, name, state, published_at::date as published_at from streams where state in (2,3,4) and slug is not null order by id
```

### promoPages

```sql
select id, locale, slug, name, state, published_at::date as published_at from promo_pages where state in (2,3,4) and slug is not null order by id
```

### slugHistory

```sql
select slug, sluggable_id, sluggable_type, locale from friendly_id_slugs where sluggable_type in ('Article','Meditation','PromoPage','Stream','SubtleSystemNode','Treatment') order by id
```

### exportedOn

```sql
select now()::date as exported_on
```

