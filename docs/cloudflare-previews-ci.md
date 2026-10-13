---
description: CI workflow, the two Cloudflare preview deployments, and the preview smoke tests.
globs:
  - ".github/**"
  - "scripts/**"
  - "tests/smoke/**"
alwaysApply: false
---

# CI and Cloudflare preview smoke tests

CI runs on every PR through [.github/workflows/ci.yml](../.github/workflows/ci.yml):

- **`gate`** — runs `pnpm lint`, `pnpm typecheck`, and `pnpm test:run` (unit tests only —
  `vitest.config.ts` excludes the smoke specs), then `pnpm ladle:build` and
  `pnpm check:wrangler`. The last is a `wrangler deploy --dry-run` over
  [wrangler.design.jsonc](../wrangler.design.jsonc): nothing else in this repo reads that file,
  so without it a typo or an `assets.directory` that drifts from what `ladle:build` writes would
  surface only in a Cloudflare build log, on `main`. It must follow `ladle:build`, which writes
  the `build/` the dry run reads, and it needs no credential and no network.
- **`smoke`** — a 2-target matrix that fetch-tests the deployed Cloudflare previews. CI runs no
  production build of the app. Cloudflare builds the previews itself.

## Two Cloudflare previews per PR

The repo connects to two Cloudflare Workers, distinguished by URL host. Neither produces a
GitHub deployment or commit status — the preview URL appears only in the
`cloudflare-workers-and-pages[bot]` PR comment. Check-run output, deployments and commit
statuses stay wired as fallbacks; what Workers Builds actually posts, if anything, is recorded
on sydevs/WeMeditateWeb#184.

| Target | Platform | URL host | Match substring | Config |
| --- | --- | --- | --- | --- |
| web | Workers Builds | `…-wemeditate-web.<acct>.workers.dev` | `wemeditate-web` | [wrangler.toml](../wrangler.toml) |
| ladle | Workers Builds | `…-wm-design.<acct>.workers.dev` | `wm-design` | [wrangler.design.jsonc](../wrangler.design.jsonc) |

⚠ A Workers preview host carries the **Worker's own name**, and the match is a plain substring
over it. So renaming the `wm-design` Worker means editing `CF_PROJECT_MATCH` in
[ci.yml](../.github/workflows/ci.yml) and `EXCLUDE` in
[the discovery script](../scripts/get-cloudflare-preview-url.mjs) in the same commit.

## The Ladle preview is built only when the library changes

The `wm-design` Worker's **Builds trigger** carries `path_includes` / `path_excludes`, set
through the Cloudflare API (the dashboard cannot express them):

- **Include:** `components/*`, `hooks/*`, `lib/*`, `layouts/*`, `assets/*`, `public/*`,
  `types/*`, `server/cms-types*`, `server/error-utils*`, `.ladle/*`, `.storybook/*`,
  `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.node-version`
- **Exclude:** `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.md`
- **Preview branches:** every branch except `gh-readonly-queue/*`, the merge queue

Cloudflare evaluates them per push, and `*` crosses `/`. A push that touches none of them gets no
Ladle preview. So the `Smoke (ladle)` job checks the same paths first: the files changed since the
push's `before` SHA (or since the PR base, on open). It skips discovery when none match, instead
of waiting out the 12-minute discovery timeout.

⚠ The list lives in **three** places: the Builds trigger, `WATCH`/`IGNORE` in
[ci.yml](../.github/workflows/ci.yml), and the lists above. Change all three together. If the CI
list is wider, `Smoke (ladle)` reddens for a preview that was never going to come. If it is
narrower, a preview that does exist goes untested.

## A missing ladle preview is red, not green

`Smoke (ladle)` fails when discovery finds no preview on a same-repo pull request. Before #184 it
passed, having tested nothing — the smoke step was the job's last and was gated on a non-empty
URL. Three cases stay green, and the "Report a missing ladle preview" step in
[ci.yml](../.github/workflows/ci.yml) says why each one is quiet: nothing was built, the merge
queue publishes no preview, or the PR is from a fork. The green path names the address it read in
the step summary, so a pass always says which preview it tested.

`Smoke (web)` keeps the silent skip on purpose. The `wemeditate-web` Worker's own
Builds-trigger branch filters are not readable from this repo, so reddening that leg could block
PRs for a cause nothing here can observe. sydevs/SahajCloud#903 replaces the discovery for both.

## The playground refuses crawlers, and answers cross-origin

Two files in the build output carry the refusal —
[.ladle/static/robots.txt](../.ladle/static/robots.txt) and
[.ladle/static/_headers](../.ladle/static/_headers), which Cloudflare reads and the
`ladle-crawler-refusal` plugin in [.ladle/crawler-refusal.ts](../.ladle/crawler-refusal.ts)
emits. `robots.txt` carries the policy, and the reason a `<meta robots>` is not a third signal.

`_headers` also sets `Access-Control-Allow-Origin: *`, which Pages supplied by default and
Workers does not — sydevs/SahajCloud#913 reads these assets cross-origin. ⚠ It stays on the one
`/*` rule: both platforms apply every matching rule and comma-join a repeated value, so a second
rule would serve the invalid `*, *`. `tests/guards/ladle-crawler-refusal.test.ts` counts them.
Workers reads `_headers` and `robots.txt` from the assets directory but **ignores** `_redirects`;
`assets.not_found_handling` in [wrangler.design.jsonc](../wrangler.design.jsonc) is its whole
equivalent.

They ship from `.ladle/static/` rather than `public/`, which the app's build copies too: a
`Disallow: /` there would answer on wemeditate.com. The app builds its own per-host refusal in
[server/sitemap.ts](../server/sitemap.ts), where `*.pages.dev` and `*.workers.dev` are already
named as hosts that must never be indexed.

⚠ Ladle copies Vite's `publicDir` for free and Storybook does not. A move to Storybook
(sydevs/SahajCloud#902) has to carry both the `public/` copy (`staticDirs`) and this plugin, or
the playground silently becomes indexable again.

## Pieces

- [scripts/get-cloudflare-preview-url.mjs](../scripts/get-cloudflare-preview-url.mjs) finds the
  preview URL through the GitHub API (PR comment, then commit statuses, then check-runs, then
  deployments). `CF_PROJECT_MATCH` selects the target, and by default the script excludes the
  Ladle playground (`wm-design`, plus the `wemeditate-design` Pages project it replaced). It
  reports what it found and never judges it — the caller decides whether an empty URL is a
  failure. It treats any HTTP response as "reachable," so a 500 is caught by the smoke specs,
  not by discovery.
- [tests/smoke/web/](../tests/smoke/web/) holds fetch-based specs for the Vike app: the homepage
  and its content, a SahajCloud page, a non-English locale, the `/en` → `/` redirect, the 404
  page, and a meditation in full and embed form. Run with `pnpm test:smoke` and `PREVIEW_URL` set.
- [tests/smoke/ladle/](../tests/smoke/ladle/) holds fetch-based Ladle specs: the app shell, a
  non-empty `/meta.json` story manifest, and the crawler refusal above — the `noindex` header and
  a `robots.txt` that is not the SPA shell. The static SPA needs no Playwright. Run with
  `pnpm test:smoke:ladle`.
- `discoverFromSahajCloud()` in `tests/smoke/_helpers/preview.ts` queries production SahajCloud
  (needs the `SAHAJCLOUD_API_KEY` Actions secret) to pick a real page or meditation, and to read
  `wm-web-config.availableLocales`. Without that secret, the specs call `ctx.skip`.

## Conventions the web specs rely on

Each fact below matches the deployed Worker's real behavior.

- A locale root has no trailing slash: `/es/` redirects (301) to `/es`.
- Only a locale in `wm-web-config.availableLocales` resolves. Any other prefix returns 404, so the
  non-English spec picks its locale from that field rather than hardcoding one — a spec pinned to
  `/es` would report an editor's config change as a broken deploy.
- The router strips the default locale: `/en` redirects (301) to `/`.
- `/index` is the router's own spelling of the home page, never a URL. A request for it
  redirects (301) to `/`, and `/<locale>/index` to `/<locale>`.
- An unknown path returns 404 and renders the ErrorFallback title "Content Not Found" — not "Page
  Not Found". The spec reads that title from `lib/translations.en.json` rather than duplicating it,
  so rewording it in SahajCloud cannot leave the markers matching nothing.
