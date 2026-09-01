# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

**Supported agents**: Claude Code, OpenAI Codex, Cursor, and other AGENTS.md-compatible tools.

> `CLAUDE.md` is a symlink to this file for Claude Code compatibility — the nested
> guide under `server/` is paired the same way. Claude-specific features (hooks, skills,
> settings) remain in the `.claude/` folder.

This guide is deliberately short. It carries only what applies everywhere and cannot be read off
the codebase; everything scoped to one part of the tree, or shaped like a procedure, lives in a
rule or a skill that loads on demand — see [Where everything lives](#where-everything-lives).

## Debugging: confirm with evidence before concluding

Pages here are server-rendered from live PayloadCMS data, so behavior often can't be inferred from source alone. Before forming or acting on a root-cause hypothesis:

- **Fetch the real output.** `curl` the deployed preview and inspect the actual HTML (`<h1>`, nav `href`s, error markers) instead of assuming what renders.
- **Query the CMS directly.** Hit the REST API to see exactly which fields populate (e.g. whether a relationship is a populated object or a bare id) before blaming the query or the code.
- **Read the request, not just the response.** The dev server logs `[PayloadCMS] GET <url> → <status>` — use it to confirm the exact query string and status code the SDK actually sent.
- **When local is blocked, verify in CI.** A CMS **403** locally means the `.env.local` key is stale (see [local-environment](docs/local-environment.md)); fall back to verifying against the deployed preview via CI.
- **Run an experiment to settle a fork.** When two hypotheses are plausible (e.g. "query is wrong" vs "data is unpublished"), test query variants against the real API rather than arguing from the code.

Track record from past sessions: several confident hypotheses were wrong until checked against real data. Prefer a quick curl/experiment over reasoning from source.

## Project Overview

WeMeditateWeb is a server-side rendered web application built with **Vike** (full-stack meta-framework), **React 19**, and **TypeScript**, deployed to **Cloudflare Workers**. It fetches content from a PayloadCMS backend via REST API and implements sophisticated edge caching using Cloudflare KV.

**Stack**: Vike + React + TypeScript + Hono + Tailwind CSS + Cloudflare Workers + PayloadCMS REST API

## Common Development Commands

```bash
# Development server (default port 5173)
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Local testing with Wrangler (Cloudflare Workers runtime)
pnpm prod

# Deploy to Cloudflare Workers
pnpm deploy

# Linting
pnpm lint

# Component development with Ladle (port 61000)
pnpm ladle

# Build static component library
pnpm ladle:build

# Type-check, and the unit suite in single-run mode (use this in scripts/CI)
pnpm typecheck
pnpm test:run

# Re-sync server/payload-types.ts from SahajCloud's main branch
pnpm types:cms

# The lean gate before pushing: lint + typecheck + test:run (--full adds pnpm build)
.claude/skills/pr-prep/check.sh
```

## Environment Setup

`cp .env.example .env.local`, then edit it with your actual values.
[.env.example](.env.example) documents every variable, which side it runs on, and where
production gets its value — read it rather than a second copy here. Both development modes
automatically read from `.env.local`:
- **Vite development** (`pnpm dev`) - reads `.env.local` directly
- **Cloudflare Workers** (`pnpm prod`) - falls back to `.env.local` when `.dev.vars` is not present

**Variable Sources:**

| Variable Type | Development | Production |
|---------------|-------------|------------|
| Server secrets | `.env.local` | Cloudflare dashboard |
| Build-time public | `.env.local` | `.env.production` (git) |
| Build-time secrets | `.env.local` | Cloudflare dashboard |

**Variable Prefixes:**
- `PUBLIC__` - Exposed to browser, embedded at build time via `envPrefix: 'PUBLIC__'` in `vite.config.ts`
- No prefix - Server-side only, accessed at runtime via `context.cloudflare.env`

**Note**: `PUBLIC__` means "browser-accessible," not "public knowledge." Variables like `PUBLIC__MAPBOX_ACCESS_TOKEN` are still YOUR secret tokens (restrict by domain).

## Cloudflare Workers Deployment

The app runs on Cloudflare Workers with server-side rendering. [server/entry.ts](server/entry.ts)
uses `@photonjs/hono` to create a Hono server with the Vike request handler; the Worker name, the
`nodejs_compat` flag and the `WEMEDITATE_CACHE` KV binding are in [wrangler.toml](wrangler.toml).
Caching is a read-through KV layer that is **optional by design** — every cache error is caught
and logged rather than failing the request. See [server/CACHING.md](server/CACHING.md).

### Keeping client-only heavy deps out of the Worker bundle

Browser-only libraries (e.g. `vidstack`/`@vidstack/react`, `hls.js`, `@mapbox/search-js-react`) must be loaded via **`ClientOnly` + `React.lazy` in a barrel**, not just a dynamic `import()` inside an effect. Vike's SSR build still bundles dynamically-imported modules into `dist/server`, so an in-effect `import('hls.js')` left the ~1.1 MB library in the Worker even though it never ran server-side.

The pattern (see [components/molecules/LocationSearch/index.tsx](components/molecules/LocationSearch/index.tsx) and [components/molecules/VideoPlayer/index.tsx](components/molecules/VideoPlayer/index.tsx)): the directory `index.tsx` re-exports a wrapper that renders `<ClientOnly fallback={…}><LazyImpl/></ClientOnly>`, where `LazyImpl = React.lazy(() => import('./Impl'))`. `ClientOnly` removes the children server-side entirely, so the heavy impl (and its deps) never enter the SSR graph.

Verify after changes: `grep -rl <lib-internal-symbol> dist/server` should find nothing (the lib should appear only as a code-split chunk under `dist/client`).

## Repo-wide conventions

Rules that hold whether or not the rule file or skill that explains them happens to be loaded.

- **A top-level path owned by a route function must be excluded from the `[slug]` matcher.**
  [pages/[slug]/+route.ts](pages/[slug]/+route.ts) matches **any single segment**, so such a path
  must be excluded there explicitly — see its `RESERVED_SEGMENTS` (currently `map`). Without the
  exclusion the path silently renders the Pages "not found" state instead of its real route.
- **UI is mobile-first and WCAG 2.1 AA — not optional.** Start at the smallest screen and enhance
  with Tailwind's `sm:`/`md:`/`lg:` prefixes; interactive targets are at least 44×44px on mobile.
  The full requirements are in [docs/rules/design-system.md](docs/rules/design-system.md).
- **Never let an in-place batch edit loose without a dry run.** Pipe the substitution to `diff`
  against one file before `perl -i` touches hundreds — see the `batch-refactoring` skill.
- **NEVER kill Chrome debugging processes (port 9222), or any process you did not start.** Chrome
  debugging may be shared across Claude instances.
- **Mapbox is the preferred provider for all mapping-related services in this project.**
- **A Cloudflare Images variant must exist in the dashboard.** The `<Image>` atom appends a variant
  named `{aspectRatio}-{width}`; the list lives in `SIZE_WIDTH_MAP` in
  [lib/cloudflare-images.ts](lib/cloudflare-images.ts), and adding one there is not enough — it
  must be configured in the Cloudflare dashboard too.
- **`pageContext` carries the locale and the KV binding.** [types/vike.d.ts](types/vike.d.ts)
  extends Vike's `PageContext` with `locale: Locale` and `cloudflare.env.WEMEDITATE_CACHE`, so both
  are type-safe in every data function and component.

## Sentry Error Tracking

**Browser Config**: [sentry.browser.config.ts](sentry.browser.config.ts)
- 100% transaction sampling
- 10% session replay (100% on errors)
- **Only activated in production** (`import.meta.env.PROD === true`)

**Testing Sentry**: Visit `/sentry` page in production build to trigger test errors

**Source Maps**: Uploaded via `@sentry/vite-plugin` in [vite.config.ts](vite.config.ts)
- Requires `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in `.env.sentry-build-plugin`

## PR Workflow (3 Phases)

PRs move through three phases. The point is to **batch CI runs** — don't push (and re-trigger the `gate` + `smoke` jobs and the two Cloudflare preview builds) on every small change.

1. **Implement** — `/implement-issue <n>` takes a ticket end-to-end: plan → branch → implement + test → lean local gate, then runs the finalize pipeline, which opens the PR and gets CI green.
2. **Adjust** — while iterating on an **open PR** (follow-up tweaks after `/implement-issue`, or any further work on a PR branch), **commit each change locally as you go, but do NOT push** — batching avoids re-running CI on every tweak. This is the one place that overrides the usual "commit/push only when asked" default: during the Adjust phase, commit follow-up changes locally without being asked; just never push (the user can still say "hold off" to pause committing).
3. **Finalize** — `/finalize-pr` ships the batch: simplify → a single `/code-review` → conditional `/security-review` (only when risky paths changed) → lean test gate → docs sync (its own `docs:` commit, the last one before pushing) → push → open/refresh the PR title + description → watch CI (with capped fixes). Run it when the PR is ready for review/merge.

Skills come from the **`workflow` plugin** (`sydevs/claude-workflow`), enabled in `.claude/settings.json`: `/workflow:draft-ticket`, `/workflow:implement-issue` (phase 1), `/workflow:finalize-pr` (phase 3, also reused by phase 1), `/workflow:cross-repo-issue`, and `/workflow:dev-server`. Per-repo variation — lean gate, contract step, security-review trigger paths, the autonomy allowlist — lives in `.claude/workflow.json`. There is exactly one copy of each skill, so there is no parity spec to keep in sync. Phase 1 runs in an **isolated git worktree by default** (`--no-worktree` opts out), removed once the PR is open and CI is green. The lean local gate stays repo-local at `.claude/skills/pr-prep/check.sh`.

**Commit and PR conventions**: conventional commits. Derive the scopes actually in use from `git log --oneline -50` rather than inventing one.

## Where everything lives

Path-scoped and procedural guidance is **not** in this file — it loads on demand, from four places.

**Path-scoped rules** (`.claude/rules/`) — conventions for one part of the tree, injected when a
matching file is read. The prose lives in `docs/rules/`; `.claude/rules/` holds symlinks to it, and
Claude Code cites the `docs/rules/` target. The indirection is deliberate: Claude Code's Protected
Paths guard makes any write under `.claude/` require interactive approval, ahead of
`permissions.allow`, so a rule body kept there stalls an unattended run that tries to update it —
the same file under `docs/` is editable freely. **Do not tidy the bodies back into `.claude/`.**

| Rule | Scope | Covers |
| --- | --- | --- |
| [design-system](docs/rules/design-system.md) | `components/**`, `layouts/**` | Atomic-design classification, mobile-first requirements, Icon/Button/Link/Divider patterns, refactoring to variants |
| [component-stories](docs/rules/component-stories.md) | `**/*.stories.tsx`, `components/ladle/**` | Ladle story structure, utility components, standard section order |
| [testing](docs/rules/testing.md) | `**/*.test.ts(x)`, `tests/**` | Vitest in `node` env, no jsdom/RTL, SSR-string assertions, the `+`-prefix trap under `pages/` |
| [zod-validation](docs/rules/zod-validation.md) | `server/validation.ts`, `pages/**/+data.ts`, FormBuilder | Schema locations, Zod 4 syntax, which status codes Vike's `render()` accepts |
| [rest-api](docs/rules/rest-api.md) | `server/cms-client.ts` and friends | Adding a cached query function, `pnpm types:cms`, API-key auth |
| [tailwind](docs/rules/tailwind.md) | `layouts/*.css`, `tailwind.config.ts` | v4 CSS-first `@theme` configuration (not `tailwind.config.ts`), fonts |

**Nested guides** — an `AGENTS.md` (with a `CLAUDE.md` symlink beside it) whose location *is* its
scope, so it needs no frontmatter, and which Codex and Cursor read as well as Claude Code.

- [server/AGENTS.md](server/AGENTS.md) — `server/**`: PayloadCMS reads must send `select` (+ `populate` at depth > 1) and `locale`; filter unpublished (bare-ID) relationships and warn to Sentry instead of rendering dead links.

**Skills** (`.claude/skills/`) — multi-step procedures, loaded when the model judges them relevant.

| Skill | Use it for |
| --- | --- |
| `component-development` | Building a new component end to end: classify, implement, export, story, verify |
| `design-extraction` | Recreating a component from a live design — Puppeteer extraction, mapping to Tailwind tokens |
| `ladle-processes` | Ladle/dev-server restarts, HMR not seeing new files, port conflicts, background-process hygiene |
| `batch-refactoring` | One textual change across many files: `find` + `perl -i`, verification, rollback |
| `dependency-updates` | Phased dependency bumps with a build + test check between groups |
| `git-push-troubleshooting` | A push or remote operation that hangs or blocks on authentication |
| `pr-prep` | `check.sh` — the lean gate (lint + `tsc --noEmit` + `test:run`); `--full` adds `pnpm build` |

**Reference docs** — long-form, read when the rule or skill that cites them says to:

- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — component architecture, design tokens, accessibility standards, implementation guidelines
- [STORYBOOK.md](STORYBOOK.md) — story utility-component API, section order, Ladle configuration
- [MCP_USAGE.md](MCP_USAGE.md) — Puppeteer and Cloudflare Docs MCP servers (Puppeteer's `evaluate` needs an explicit `return`)
- [DEVELOPMENT_STANDARDS.md](DEVELOPMENT_STANDARDS.md) — team-wide web standards: formatting, editor config, browser support
- [docs/cloudflare-previews-ci.md](docs/cloudflare-previews-ci.md) — CI workflow, the two Cloudflare previews (web Worker vs Ladle Pages), and the preview smoke tests
- [docs/local-environment.md](docs/local-environment.md) — local CMS key gotchas (403 = stale key vs 400 = bad query) and `getWebConfig` caching

⚠ These are **linked, not `@`-imported**. `@DESIGN_SYSTEM.md`, `@STORYBOOK.md` and `@MCP_USAGE.md`
used to head this file, and Claude Code's `@` syntax imports the target — pulling 3,256 further
lines into every session before a word of them was needed. Keep them as plain links.
