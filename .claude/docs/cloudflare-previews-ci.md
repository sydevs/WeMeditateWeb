---
description: CI workflow, the two Cloudflare preview deployments, and the preview smoke tests.
globs:
  - ".github/**"
  - "scripts/**"
  - "tests/smoke/**"
alwaysApply: false
---

# CI & Cloudflare preview smoke tests

CI runs on every PR via [.github/workflows/ci.yml](../../.github/workflows/ci.yml):

- **`gate`** — `pnpm lint`, `pnpm typecheck`, `pnpm test:run` (unit only; smoke specs are excluded in `vitest.config.ts`).
- **`smoke`** — a 2-target matrix that fetch-smoke-tests the deployed Cloudflare previews. There is **no production build in CI**; Cloudflare builds the previews.

## Two Cloudflare previews per PR

The repo is connected to **two** Cloudflare projects, distinguished by **URL host**. There are **no GitHub deployments or commit statuses** for these — the preview URL is posted only in the `cloudflare-workers-and-pages[bot]` **PR comment** (and, for Ladle, the "Cloudflare Pages" check-run output).

| Target | Platform | URL host | Match substring |
| --- | --- | --- | --- |
| web | Workers Builds | `…-wemeditate-web.<acct>.workers.dev` | `wemeditate-web` |
| ladle | Pages | `…wm-design.pages.dev` | `wm-design` |

## Pieces

- [scripts/get-cloudflare-preview-url.mjs](../../scripts/get-cloudflare-preview-url.mjs) — discovers the preview URL from the GitHub API (PR comment → commit statuses → check-runs → deployments). `CF_PROJECT_MATCH` selects the target; the Ladle project (`wm-design`/`wemeditate-design`) is excluded by default. Treats **any** HTTP response as "reachable" so a 500 is caught by the specs rather than failing discovery.
- [tests/smoke/web/](../../tests/smoke/web/) — fetch-based specs for the Vike app: homepage + content, a CMS page, a non-English locale, the `/en`→`/index` redirect, the 404 page, and meditation full/embed. `pnpm test:smoke` with `PREVIEW_URL` set.
- [tests/smoke/ladle/](../../tests/smoke/ladle/) — fetch-based Ladle specs: app shell + a non-empty `/meta.json` story manifest (no Playwright needed for the static SPA). `pnpm test:smoke:ladle`.
- `discoverFromCms()` in `tests/smoke/_helpers/preview.ts` queries the production CMS (needs the `SAHAJCLOUD_API_KEY` Actions secret) to pick a real page/meditation; specs `ctx.skip` without it.

## Conventions the web specs rely on (verified against the deployed Worker)

- Locale roots have **no trailing slash**: `/es/` → 301 → `/es`.
- The default locale is stripped: `/en` → 301 → `/index`.
- Unknown paths → **404** rendering the ErrorFallback **"Content Not Found"** title (not "Page Not Found").
