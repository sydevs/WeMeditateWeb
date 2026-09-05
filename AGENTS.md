# AGENTS.md

This file gives AI coding agents guidance for this repository.

**Supported agents**: Claude Code, OpenAI Codex, Cursor, and other AGENTS.md-compatible tools.

> `CLAUDE.md` is a symlink to this file for Claude Code compatibility. The nested guide under
> `server/` uses the same symlink pattern. Claude-specific features (hooks, skills, settings) stay
> in the `.claude/` folder.

This guide stays short on purpose. It states only facts that apply everywhere and that the code
does not show directly. Rules for one part of the tree, or steps for a procedure, load on demand
from a rule or a skill. See [Where everything lives](#where-everything-lives).

## Debugging: confirm with evidence before concluding

Pages here render on the server from live PayloadCMS data. Source code alone often does not show
the real behavior. Before you form or act on a root-cause hypothesis, do this:

- **Fetch the real output.** Use `curl` on the deployed preview. Confirm the actual HTML (`<h1>`,
  nav `href` values, error markers) instead of guessing what renders.
- **Query the CMS directly.** Call the REST API to see which fields populate. Confirm whether a
  relationship returns a populated object or a bare id before you blame the query or the code.
- **Read the request, not only the response.** The dev server logs
  `[PayloadCMS] GET <url> → <status>`. Use this log to confirm the exact query string and status
  code the SDK sent.
- **When local access is blocked, confirm in CI instead.** A local **403** means the `.env.local`
  key is stale. See [local-environment](docs/local-environment.md). Then confirm against the
  deployed preview through CI.
- **Run an experiment to settle competing hypotheses.** When two hypotheses seem possible (for
  example, "the query is wrong" vs "the data is unpublished"), test query variants against the
  real API. Do not argue from the code alone.

In past sessions, confident hypotheses were often wrong until confirmed against real data. Prefer a
quick experiment over reasoning from source code alone.

## Project Overview

WeMeditateWeb is a server-rendered web application. It uses Vike (a full-stack framework),
React 19, and TypeScript. It deploys to Cloudflare Workers.

It fetches content from a PayloadCMS backend through the REST API. It caches content at the edge
with Cloudflare KV.

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

# Type-check, and run the unit suite once (use this in scripts and CI)
pnpm typecheck
pnpm test:run

# Re-sync server/payload-types.ts from SahajCloud's main branch
pnpm types:cms

# The lean gate before push: lint + typecheck + test:run (--full adds pnpm build)
.claude/skills/pr-prep/check.sh
```

## Environment Setup

Run `cp .env.example .env.local`, then edit the new file with your real values.
[.env.example](.env.example) lists every variable. It states which side uses each variable and
where production's value comes from. Read that file instead of a second copy here.

Both development modes read from `.env.local` automatically:
- **Vite development** (`pnpm dev`) reads `.env.local` directly.
- **Cloudflare Workers** (`pnpm prod`) reads `.env.local` when `.dev.vars` does not exist.

**Variable Sources:**

| Variable Type | Development | Production |
|---------------|-------------|------------|
| Server secrets | `.env.local` | Cloudflare dashboard |
| Build-time public | `.env.local` | `.env.production` (git) |
| Build-time secrets | `.env.local` | Cloudflare dashboard |

**Variable Prefixes:**
- `PUBLIC__` — the browser can access this variable. The build embeds it at build time via
  `envPrefix: 'PUBLIC__'` in `vite.config.ts`.
- No prefix — server-side only. The runtime reads it via `context.cloudflare.env`.

**Note**: `PUBLIC__` means the browser can read the variable. It does not mean the value is
public. Tokens like `PUBLIC__MAPBOX_ACCESS_TOKEN` stay secret. Restrict them by domain.

## Cloudflare Workers Deployment

The app runs on Cloudflare Workers with server-side rendering.
[server/entry.ts](server/entry.ts) uses `@photonjs/hono` to build a Hono server with the Vike
request handler. [wrangler.toml](wrangler.toml) sets the Worker name, the `nodejs_compat` flag,
and the `WEMEDITATE_CACHE` KV binding.

Caching is a read-through KV layer. It is optional by design: the code catches and logs every
cache error, and the request never fails because of a cache error. See
[server/CACHING.md](server/CACHING.md).

### Keep client-only heavy deps out of the Worker bundle

Load browser-only libraries (for example `vidstack`/`@vidstack/react`, `hls.js`,
`@mapbox/search-js-react`) with **`ClientOnly` + `React.lazy` in a barrel**. Do not load them with
a plain dynamic `import()` inside an effect.

Vike's SSR build still bundles a dynamically imported module into `dist/server`. An in-effect
`import('hls.js')` once left the ~1.1 MB library in the Worker, even though it never ran on the
server.

The pattern (see
[components/molecules/LocationSearch/index.tsx](components/molecules/LocationSearch/index.tsx)
and [components/molecules/VideoPlayer/index.tsx](components/molecules/VideoPlayer/index.tsx)):
the directory's `index.tsx` re-exports a wrapper. The wrapper renders
`<ClientOnly fallback={…}><LazyImpl/></ClientOnly>`, where
`LazyImpl = React.lazy(() => import('./Impl'))`. `ClientOnly` removes the children on the server
entirely, so the heavy implementation and its dependencies never enter the SSR graph.

After a change, confirm with `grep -rl <lib-internal-symbol> dist/server`. This command must find
nothing. The library should appear only as a code-split chunk under `dist/client`.

## Repo-wide conventions

These rules apply whether or not the matching rule file or skill is loaded.

- **Exclude a route-owned path from the `[slug]` matcher.**
  [pages/[slug]/+route.ts](pages/[slug]/+route.ts) matches any single path segment. A path owned
  by its own route function (for example `/map`) needs an explicit exclusion in
  `RESERVED_SEGMENTS`. Without this exclusion, the path silently renders the Pages "not found"
  state instead of its real route.
- **UI must be mobile-first and meet WCAG 2.1 AA.** See
  [design-system](docs/rules/design-system.md) for the full rules, including breakpoints and
  touch-target sizes.
- **Test a batch edit on one file before running it everywhere.** Pipe the substitution through
  `diff` against a single file first. Run `perl -i` on the full set only after you confirm the
  `diff` output. See the `batch-refactoring` skill.
- **Never stop a Chrome debugging process (port 9222), or any process you did not start.** Other
  Claude instances may share this Chrome debugging session.
- **Mapbox is the preferred mapping provider for this project.**
- **Create each Cloudflare Images variant in the dashboard too.** The `<Image>` atom appends a
  variant name in the form `{aspectRatio}-{width}`. The list of variants lives in
  `SIZE_WIDTH_MAP` in [lib/cloudflare-images.ts](lib/cloudflare-images.ts). Adding a variant there
  is not enough. You must also configure it in the Cloudflare dashboard.
- **`pageContext` carries the locale and the KV binding.** [types/vike.d.ts](types/vike.d.ts)
  extends Vike's `PageContext` with `locale: Locale` and `cloudflare.env.WEMEDITATE_CACHE`. Both
  fields stay type-safe in every data function and component.

## Sentry Error Tracking

**Browser config**: [sentry.browser.config.ts](sentry.browser.config.ts)
- Samples 100% of transactions.
- Records 10% of sessions as replay (100% after an error).
- Activates only in production (`import.meta.env.PROD === true`).

**Testing Sentry**: Visit the `/sentry` page in a production build to trigger test errors.

**Source maps**: The `@sentry/vite-plugin` uploads them. Configure it in
[vite.config.ts](vite.config.ts). It needs `SENTRY_ORG`, `SENTRY_PROJECT`, and
`SENTRY_AUTH_TOKEN` in `.env.sentry-build-plugin`.

## PR Workflow (3 Phases)

PRs move through three phases. The point is to batch CI runs. Do not push on every small change,
because each push re-triggers the `gate` and `smoke` jobs and both Cloudflare preview builds.

1. **Implement.** `/implement-issue <n>` takes a ticket through this sequence: plan, branch,
   implement and test, then the lean local gate. It then runs the finalize pipeline, which opens
   the PR and makes CI pass.
2. **Adjust.** While you work on an **open PR** — follow-up tweaks after `/implement-issue`, or
   any later change on the PR branch — commit each change locally as you go. Do not push during
   this phase. Batching avoids a CI re-run on every small tweak.

   This phase overrides the usual "commit and push only when asked" default. During Adjust,
   commit follow-up changes locally without being asked, and never push them yourself. The user
   can still say "hold off" to pause the automatic committing.
3. **Finalize.** `/finalize-pr` ships the batch through this sequence:
   - Simplify the code.
   - Run `/pr-review-toolkit:review-pr all`.
   - Run `/security-review`, only when risky paths changed.
   - Run the lean test gate.
   - Sync the docs in their own `docs:` commit, the last commit before the push.
   - Push the branch.
   - Open or refresh the PR title and description.
   - Watch CI, with a capped number of automatic fixes.

   Run `/finalize-pr` when the PR is ready for review or merge.

Skills come from the **`workflow` plugin** (`sydevs/claude-workflow`), enabled in
`.claude/settings.json`. The plugin provides `/workflow:draft-ticket`,
`/workflow:implement-issue` (phase 1), `/workflow:finalize-pr` (phase 3, also used by phase 1),
`/workflow:cross-repo-issue`, and `/workflow:dev-server`.

`.claude/workflow.json` holds the per-repo variation: the lean gate, the contract step, the
security-review trigger paths, and the autonomy allowlist. Each skill exists in exactly one
place, so no parity spec needs syncing across repos.

Phase 1 runs in an isolated git worktree by default. Pass `--no-worktree` to opt out. The
worktree is removed once the PR is open and CI is green.

The lean local gate stays in this repo, at `.claude/skills/pr-prep/check.sh`.

**Commit and PR conventions**: Use Conventional Commits. Find the scopes in current use in
`git log --oneline -50`. Do not invent a new scope.

## Where everything lives

Path-scoped and procedural guidance does not live in this file. It loads on demand, from four
places.

**Path-scoped rules** (`.claude/rules/`) apply to one part of the tree. Claude Code injects a
rule when it reads a matching file. The prose text lives in `docs/rules/`. `.claude/rules/` holds
only symlinks to those files, and Claude Code cites the `docs/rules/` target.

This indirection is deliberate. Claude Code's Protected Paths guard requires interactive approval
for any write under `.claude/`, ahead of `permissions.allow`. A rule body stored there would
stall an unattended run that tries to update it. The same file under `docs/` stays freely
editable. **Do not move a rule body back into `.claude/`.**

| Rule | Scope | Covers |
| --- | --- | --- |
| [design-system](docs/rules/design-system.md) | `components/**`, `layouts/**` | Atomic-design classification, mobile-first requirements, Icon/Button/Link/Divider patterns, refactoring to variants |
| [component-stories](docs/rules/component-stories.md) | `**/*.stories.tsx`, `components/ladle/**` | Ladle story structure, utility components, standard section order |
| [testing](docs/rules/testing.md) | `**/*.test.ts(x)`, `tests/**` | Vitest in `node` env, no jsdom/RTL, SSR-string assertions, the `+`-prefix trap under `pages/` |
| [zod-validation](docs/rules/zod-validation.md) | `server/validation.ts`, `pages/**/+data.ts`, FormBuilder | Schema locations, Zod 4 syntax, which status codes Vike's `render()` accepts |
| [rest-api](docs/rules/rest-api.md) | `server/cms-client.ts` and friends | Adding a cached query function, `pnpm types:cms`, API-key auth |
| [tailwind](docs/rules/tailwind.md) | `layouts/*.css`, `tailwind.config.ts` | v4 CSS-first `@theme` configuration (not `tailwind.config.ts`), fonts |

**Nested guides** are an `AGENTS.md` file with a `CLAUDE.md` symlink beside it. Its folder
location defines its scope, so it needs no frontmatter. Codex and Cursor read it, as well as
Claude Code.

- [server/AGENTS.md](server/AGENTS.md) covers `server/**`. PayloadCMS reads must send `select`
  (plus `populate` at depth > 1) and `locale`. Filter out unpublished relationships that return a
  bare id, and log a Sentry warning instead of rendering a dead link.

**Skills** (`.claude/skills/`) are multi-step procedures. The model loads one when it judges the
skill relevant.

| Skill | Use it for |
| --- | --- |
| `component-development` | Building a new component end to end: classify, implement, export, story, confirm |
| `design-extraction` | Recreating a component from a live design — Puppeteer extraction, mapping to Tailwind tokens |
| `ladle-processes` | Ladle/dev-server restarts, HMR not seeing new files, port conflicts, background-process hygiene |
| `batch-refactoring` | One textual change across many files: `find` + `perl -i`, verification, rollback |
| `dependency-updates` | Phased dependency bumps with a build and test step between groups |
| `git-push-troubleshooting` | A push or remote operation that hangs or blocks on authentication |
| `pr-prep` | `check.sh` runs the lean gate: lint, `tsc --noEmit`, `test:run`. `--full` adds `pnpm build` |

**Reference docs** are long-form. Read one when the rule or skill that cites it tells you to:

- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — component architecture, design tokens, accessibility
  standards, and implementation guidelines.
- [STORYBOOK.md](STORYBOOK.md) — the story utility-component API, section order, and Ladle
  configuration.
- [MCP_USAGE.md](MCP_USAGE.md) — MCP server usage notes, including Puppeteer's `evaluate` (needs
  an explicit `return`).
- [docs/cloudflare-previews-ci.md](docs/cloudflare-previews-ci.md) — the CI workflow, the two
  Cloudflare previews (the web Worker and the Ladle Pages site), and the preview smoke tests.
- [docs/local-environment.md](docs/local-environment.md) — local CMS key issues (403 means a
  stale key, 400 means a bad query) and `getWebConfig` caching.

⚠ These links are **plain links, not `@`-imports**. `@DESIGN_SYSTEM.md`, `@STORYBOOK.md`, and
`@MCP_USAGE.md` used to head this file. Claude Code's `@` syntax imports the full target file, so
this pulled 3,256 extra lines into every session before anyone needed a word of them. Keep these
as plain links.
