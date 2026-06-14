# Repo Conventions

## Conventional commits

Format: `<type>(<scope>): <subject>`

### Types

| Type       | When to use                                  |
| ---------- | -------------------------------------------- |
| `feat`     | New user-facing feature or behavior          |
| `fix`      | Bug fix                                       |
| `refactor` | Internal restructure with no behavior change |
| `chore`    | Tooling, config, dependencies, infra         |
| `docs`     | Documentation only                           |
| `test`     | Test additions/changes only                  |
| `perf`     | Performance improvements                     |
| `build`    | Build system / bundler / Wrangler config     |

### Scopes seen in this repo

(From recent `git log` + the directory structure — extend as new areas appear.)

- `cms` — REST API client, SahajCloud integration (`server/cms-client.ts`, `server/payload-client.ts`)
- `player` / `meditation` — MeditationPlayer, audio/video/HLS playback
- `preview` — PayloadCMS live-preview routes (`pages/preview/`)
- `images` — Cloudflare Images variants (`lib/cloudflare-images.ts`, `Image` atom)
- `caching` / `kv` — Cloudflare KV cache (`server/kv-cache.ts`)
- `locale` / `i18n` — locale extraction, `Link` prefixing, translations
- `routing` — Vike routes / `+route.ts` / `+onBeforeRoute.ts`
- `components` (or `atoms` / `molecules` / `organisms`) — UI component work
- `design-system` / `ladle` — design tokens, stories
- `validation` / `zod` — Zod schemas (`server/validation.ts`)
- `env` — environment variable config
- `error-handling` — error utils, error pages (`server/error-utils.ts`)
- `deps` — dependency updates
- `build` — Vite / Vike / Wrangler / build config
- `claude` — `.claude/` skills, hooks, settings

### Title rules

- Imperative mood: "add", not "added" / "adds"
- ≤ 70 characters
- No trailing period
- Lowercase subject (after the colon)
- Closes refs go in the body, not the title

### Examples (good)

- `fix(cms): send select + populate on all API client collection reads`
- `feat: Cloudflare Images integration with predefined variants`
- `refactor: remove redundant CMS config passing using Hono context storage`
- `chore: Update package dependencies across the board`
- `fix(player): correct meditation frame selection`

### Examples (avoid)

- ❌ `Updates` (vague, no scope, no type)
- ❌ `feat: stuff` (no scope, vague subject)
- ❌ `fix(cms): Fixed a really annoying bug where the meditation...` (over 70 chars, past tense)

## Issue title format

Two conventions are in use:

1. **Conventional-commit form** — preferred when the type/scope is clear; the implementer reuses it verbatim as the PR title.
2. **`Area: description` form** — common for feature/enhancement issues (`Pages: baseline rich-text renderer`, `Meditations: music offering + related content`). Acceptable; the implementer translates it into a conventional-commit PR title.

Labels in use: `enhancement`, `bug`, `good first issue`, `wait for upstream`.

## PR description format

Required sections (per `.claude/skills/pr-prep/SKILL.md` and `.claude/skills/implement-issue/pr-template.md`):

```markdown
## Summary

[1-3 bullets]

## Test Results

- Lint: ✓ No errors (`pnpm lint`)
- Types: ✓ Clean (`pnpm exec tsc --noEmit`)
- Tests: ✓ X passed (`pnpm test:run`)
- Build: ✓ Success (`pnpm build`) — or "N/A — no build-affecting changes"

## Preview deployment

- Cloudflare preview: ✓ deployed

Closes #NNN
```

There is no test/lint CI — the Cloudflare preview deployment is the only automated PR check, so the local gate (lint + tsc + tests, build for build-affecting changes) is the substantive verification.
