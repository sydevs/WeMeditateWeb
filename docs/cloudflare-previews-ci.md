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
  `vitest.config.ts` excludes the smoke specs).
- **`smoke`** — a 2-target matrix that fetch-tests the deployed Cloudflare previews. CI runs no
  production build. Cloudflare builds the previews itself.

## Two Cloudflare previews per PR

The repo connects to two Cloudflare projects, distinguished by URL host. Neither produces a
GitHub deployment or commit status — the preview URL appears only in the
`cloudflare-workers-and-pages[bot]` PR comment (and, for Ladle, in the "Cloudflare Pages"
check-run output).

| Target | Platform | URL host | Match substring |
| --- | --- | --- | --- |
| web | Workers Builds | `…-wemeditate-web.<acct>.workers.dev` | `wemeditate-web` |
| ladle | Pages | `…wm-design.pages.dev` | `wm-design` |

## The Ladle preview is built only when the library changes

The `wemeditate-design` Pages project has **build watch paths**, set in the Cloudflare dashboard
(Settings → Build → Build watch paths). Nothing in this repo holds them:

- **Include:** `components/*`, `hooks/*`, `lib/*`, `layouts/*`, `assets/*`, `public/*`,
  `types/*`, `server/cms-types*`, `server/error-utils*`, `.ladle/*`, `.storybook/*`,
  `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.node-version`
- **Exclude:** `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.md`
- **Preview branches:** every branch except `gh-readonly-queue/*`, the merge queue

Cloudflare evaluates them per push, and `*` crosses `/`. A push that touches none of them gets no
Ladle preview. So the `Smoke (ladle)` job checks the same paths first: the files changed since the
push's `before` SHA (or since the PR base, on open). It skips discovery when none match, instead
of waiting out the 12-minute discovery timeout.

⚠ The list lives in two places: the dashboard and `WATCH`/`IGNORE` in
[ci.yml](../.github/workflows/ci.yml). Change both together. If the CI list is wider, discovery waits out its
timeout for a preview that never comes. If it is narrower, a preview that does exist goes
untested.

## The playground refuses crawlers

Two files in the build output carry the refusal —
[.ladle/static/robots.txt](../.ladle/static/robots.txt) and
[.ladle/static/_headers](../.ladle/static/_headers), which Cloudflare Pages reads and the
`ladle-crawler-refusal` plugin in [.ladle/crawler-refusal.ts](../.ladle/crawler-refusal.ts)
emits. `robots.txt` carries the policy, and the reason a `<meta robots>` is not a third signal.

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
  Ladle project (`wm-design`/`wemeditate-design`). It treats any HTTP response as "reachable," so
  a 500 is caught by the smoke specs, not by discovery.
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
