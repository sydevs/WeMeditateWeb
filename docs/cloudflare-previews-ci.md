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

## Pieces

- [scripts/get-cloudflare-preview-url.mjs](../scripts/get-cloudflare-preview-url.mjs) finds the
  preview URL through the GitHub API (PR comment, then commit statuses, then check-runs, then
  deployments). `CF_PROJECT_MATCH` selects the target, and by default the script excludes the
  Ladle project (`wm-design`/`wemeditate-design`). It treats any HTTP response as "reachable," so
  a 500 is caught by the smoke specs, not by discovery.
- [tests/smoke/web/](../tests/smoke/web/) holds fetch-based specs for the Vike app: the homepage
  and its content, a CMS page, a non-English locale, the `/en` → `/index` redirect, the 404 page,
  and a meditation in full and embed form. Run with `pnpm test:smoke` and `PREVIEW_URL` set.
- [tests/smoke/ladle/](../tests/smoke/ladle/) holds fetch-based Ladle specs: the app shell and a
  non-empty `/meta.json` story manifest. The static SPA needs no Playwright. Run with
  `pnpm test:smoke:ladle`.
- `discoverFromCms()` in `tests/smoke/_helpers/preview.ts` queries the production CMS (needs the
  `SAHAJCLOUD_API_KEY` Actions secret) to pick a real page or meditation. Without that secret, the
  specs call `ctx.skip`.

## Conventions the web specs rely on

Each fact below matches the deployed Worker's real behavior.

- A locale root has no trailing slash: `/es/` redirects (301) to `/es`.
- The router strips the default locale: `/en` redirects (301) to `/index`.
- An unknown path returns 404 and renders the ErrorFallback title "Content Not Found" — not "Page
  Not Found".
