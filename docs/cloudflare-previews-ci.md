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
  `vitest.config.ts` excludes the smoke specs), then writes the accessibility results to the job
  summary, then `pnpm ladle:build` and `pnpm check:wrangler`. **The accessibility gate is one of
  those unit specs** — [tests/a11y/page-types.test.tsx](../tests/a11y/page-types.test.tsx) runs
  `axe-core` over every page type and fails on any finding, so it blocks a change the way any
  spec does. It is here rather than in `smoke` because `Smoke (web)` skips silently when no
  preview is discoverable, and a check that can skip cannot stop a change. `scripts/a11y-summary.mjs`
  only reports: it runs on a red test step too, because the per-page counts are what a reviewer
  needs most then. The last is a `wrangler deploy --dry-run` over
  [wrangler.design.jsonc](../wrangler.design.jsonc): nothing else in this repo reads that file,
  so without it a typo or an `assets.directory` that drifts from what `ladle:build` writes would
  surface only in a Cloudflare build log, on `main`. It must follow `ladle:build`, which writes
  the `build/` the dry run reads, and it needs no credential and no network.
- **`smoke`** — a 2-target matrix that fetch-tests the deployed Cloudflare previews. CI runs no
  production build of the app. Cloudflare builds the previews itself.

## Two Cloudflare previews per PR

The repo connects to two Cloudflare projects, distinguished by URL host. Neither produces a
GitHub deployment or commit status — the preview URL appears only in the
`cloudflare-workers-and-pages[bot]` PR comment. Workers Builds does post one check run per
Worker, named `Workers Builds: <worker>`, but its `details_url` is the `dash.cloudflare.com`
build page and carries no preview address. Check-run output, deployments and commit statuses
stay wired as fallbacks that have never yet yielded a URL here.

⚠ The ladle preview is the `wemeditate-design` Worker. Discovery accepts a `workers.dev` host and
nothing else, because a PR opened before 2026-11-02 still carries a `wemeditate-design` **Pages**
comment: it matched `CF_PROJECT_MATCH` by project name, came first, and its `wm-design.pages.dev`
host no longer resolves (#184). Such a PR gets no Workers comment for that Worker either —
Cloudflare comments only from its Git integration's own lifetime — so once the whole discovery
window has named nothing, discovery spells the Worker's branch host itself:
`<branch-slug>-<worker>.<account>.workers.dev`, taking the account subdomain from whatever other
preview the PR does carry. It waits out that window first because the branch alias tracks the
branch's latest successful build rather than this commit, so running it earlier would hand the
specs the previous build while this commit's own was still deploying. The address still has to
answer before it reaches the specs. Read the `selected …` and `skipping …` lines the step prints.

⚠ **A comment is only accepted while it names the commit under test.** Cloudflare rewrites one
comment per Worker in place, so between a push and that build finishing the comment still carries
the previous commit's address, and discovery used to take it — the smoke lane then measured the
build before the one on trial, reporting failures for routes the commit adds and missing what it
broke (#282). Discovery now reads the comment's `Latest Commit` cell and keeps polling until it
matches `PR_HEAD_SHA`. The other sources are keyed on the SHA already; the derived branch host is
not, which is a second reason it runs only after the window closes.

| Target | Platform | URL host | Match substring | Config |
| --- | --- | --- | --- | --- |
| web | Workers Builds | `…-wemeditate-web.<acct>.workers.dev` | `wemeditate-web` | [wrangler.toml](../wrangler.toml) |
| ladle | Workers Builds | `…-wemeditate-design.<acct>.workers.dev` | `wemeditate-design` | [wrangler.design.jsonc](../wrangler.design.jsonc) |

⚠ A Workers preview host carries the **Worker's own name**, and the match is a plain substring
over it. So renaming the `wemeditate-design` Worker means editing `CF_PROJECT_MATCH` in
[ci.yml](../.github/workflows/ci.yml) and `EXCLUDE` in
[the discovery script](../scripts/get-cloudflare-preview-url.mjs) in the same commit.

## The Ladle preview builds only when the library changes

Both of the `wemeditate-design` Worker's **Builds triggers** — `main`, and every other branch —
carry these path rules, set through the Cloudflare API on 2026-11-02 (sydevs/SahajAtlasWeb#266).

- **Include:** `components/*`, `hooks/*`, `lib/*`, `layouts/*`, `assets/*`, `public/*`,
  `types/*`, `server/sahajcloud-types*`, `server/error-utils*`, `.ladle/*`, `.storybook/*`,
  `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.node-version`

  ⚠ Both Cloudflare triggers still include `server/cms-types*`, the name that file lost in #131.
  Until they are edited in Cloudflare (they are not in this repo), a push touching only
  `server/sahajcloud-types.ts` builds no Ladle preview while `Smoke (ladle)` waits out its window.
- **Exclude:** `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.md`
- **Preview branches:** every branch except `main`. ⚠ The API refuses `gh-readonly-queue/*` with
  `12002 Invalid request body` — a branch rule takes only a literal name or a lone `*` — so
  merge-queue branches build a preview nothing reads, accepted in sydevs/SahajAtlasWeb#266.

Cloudflare evaluates them per push, and `*` crosses `/`, so a push touching none of them gets no
Ladle preview. `Smoke (ladle)` already checks the same paths first: the files
changed since the push's `before` SHA (or since the PR base, on open). It skips discovery when
none match, instead of waiting out the 12-minute discovery timeout.

⚠ The list lives in **three** places: the Cloudflare build trigger, `WATCH`/`IGNORE` in
[ci.yml](../.github/workflows/ci.yml), and the lists above. Change all three together. If the CI
list is wider, `Smoke (ladle)` reddens for a preview that was never going to come. If it is
narrower, a preview that does exist goes untested.

## The Ladle build opts out of one SWC check

Ladle compiles through `@swc/core`, which it imports at startup. Since 1.16.12 SWC's native addon
ships compressed and unpacks itself into a cache directory on first load. It refuses any directory
with an ancestor that another user can write without a sticky bit. Since 2026-11-13 the Workers
build image fails that rule for both `~/.cache` and `/tmp`, so every `wemeditate-design` build
died with `ERR_SWC_NATIVE_CACHE` as soon as `ladle build` started. The same lockfile had built
there on 2026-11-07 (#233).

So `pnpm ladle:build` sets `SWC_NATIVE_BINDING_CACHE_SKIP_SECURITY_CHECK` to `1` when
`WORKERS_CI` is set. Workers Builds injects `WORKERS_CI` into every build, and nothing else here
sets it, so the check stays on locally and in `gate`. The variable turns off only the ancestor
check, and the addon still verifies its own payload. It has to be in the script: Ladle loads SWC
when it starts, before it reads `.ladle/config.mjs`, so a config file cannot set it in time.
sydevs/SahajAtlasWeb's playground uses the same prefix.

⚠ The opt-out lives only in the `ladle:build` script, so the `wemeditate-design` build command —
set in the Cloudflare dashboard, not in this repo — must stay `pnpm ladle:build`. A bare
`ladle build` there drops the prefix and the build dies again. The crawler refusal survives that
change, because [.ladle/crawler-refusal.ts](../.ladle/crawler-refusal.ts) emits its files from the
Vite build. This cannot.

⚠ GitHub's runners and macOS both pass SWC's check, so dropping the prefix fails nowhere but a
Cloudflare build log. [tests/guards/ladle-swc-cache.test.ts](../tests/guards/ladle-swc-cache.test.ts)
pins it, since `package.json` cannot carry a comment saying why it is there.

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

Both legs end with a "Smoke results" step that copies vitest's own passed, failed, skipped and todo
counts into the job summary (`scripts/smoke-skip-summary.mjs`) and warns when nothing asserted. A
spec skips itself with `ctx.skip` when it has no `SAHAJCLOUD_API_KEY` or no discoverable content,
and vitest counts that as a pass, so the warning is the only sign that the leg asserted nothing.
The step runs on pull requests only — the merge queue publishes no preview, so there is nothing
there to count.

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
  deployments), and derives the target's own branch host only when none of those named one.
  `CF_PROJECT_MATCH` selects the target, and both CI legs set one; the derivation also reads it
  as the Worker's exact name. Without it — a local or ad-hoc run — the script instead excludes
  the Ladle playground (`wemeditate-design`), so that `EXCLUDE` list never applies in CI. It reports what it found and never judges it — the caller decides whether an
  empty URL is a failure. It treats any HTTP response as "reachable," so a 500 is caught by the smoke specs,
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
