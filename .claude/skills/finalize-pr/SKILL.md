---
name: finalize-pr
description: Finalize the current branch's PR — simplify, a single code-review, conditional security-review, the lean gate, a documentation-sync commit, push, create or refresh the PR, and watch CI with a capped fix-loop. User-invoked; also run as the final step of /implement-issue. Does not run unless explicitly triggered.
disable-model-invocation: true
effort: max
allowed-tools: Bash(*), Read, Edit, Write, Grep, Glob, Task
---

# Finalize PR

The reusable **ship pipeline** for **WeMeditateWeb** (Vike + React + TypeScript + Cloudflare Workers frontend over the SahajCloud PayloadCMS): take the current branch's accumulated local commits and ship them — simplify → single code-review → conditional security-review → lean gate → update docs → push → open/refresh the PR → get CI green → report.

This is **phase 3** of the PR workflow (Implement → Adjust → **Finalize**) documented in `CLAUDE.md` → "PR Workflow (3 Phases)" (aliased by `AGENTS.md`). `/implement-issue` runs this pipeline at the end of its implementation; you also run it directly (`/finalize-pr`) once you're happy with a batch of local-only Adjust-phase commits — it's what turns those un-pushed commits into one pushed PR + one CI run.

## Stack quick reference

- **pnpm only.** Lint `pnpm lint` · Types `pnpm typecheck` (`tsc --noEmit`) · Tests `pnpm test:run` (Vitest, unit) · Build `pnpm build` (vike build).
- **Lean gate:** `.claude/skills/pr-prep/check.sh` (lint + tsc + test:run); `--full` adds `pnpm build`.
- **CI** (`.github/workflows/ci.yml`, on every PR): a `gate` job (**Lint, Typecheck & Unit**) + a `smoke` matrix (**Smoke (web)** / **Smoke (ladle)**) that fetch-tests the deployed Cloudflare previews. Two Cloudflare preview builds also run per PR: **Workers Builds: wemeditate-web** (the Vike Worker) and **Cloudflare Pages** (the Ladle design system). See `.claude/docs/cloudflare-previews-ci.md`.

## Invocation

```
/finalize-pr
```

Operates on the current branch — no arguments. Run it from the feature branch you want to ship.

## Pipeline

The diff to review/ship is the **whole branch** — every commit since it diverged from `main`, the range `origin/main...HEAD` — not just the last commit. Reuse that range throughout.

### 0. Pre-flight

```bash
git branch --show-current                 # must NOT be main / a shared branch
git status --short                        # working tree
git rev-list --count origin/main..HEAD    # commits to ship
```

- **Abort if on `main`** (or any shared branch).
- **Commit any pending working-tree changes first** — this is the end of the Adjust phase, so those uncommitted edits are part of what's shipping. If anything looks unrelated/unexpected, **stop and ask** rather than committing it. Never commit secrets / `.env`.
- If there's **nothing ahead of `origin/main`** and the PR (if any) is already green, say so and exit — nothing to finalize.

### 1. Simplify

Run the `/simplify` slash command over the **entire branch diff** (`origin/main...HEAD`). Quality pass for reuse / simplification / efficiency / altitude — it does **not** hunt for bugs.

- Let it apply fixes; review them and revert anything undesirable.
- If it changed anything, re-run the lean gate (step 4) and commit (`refactor: simplify per /simplify pass`). If it made no changes, continue.

### 2. Code review (`/code-review`) — single pass

Run **one** code-review pass over the full branch diff, in an **isolated context** so its file reading doesn't bloat the main thread. **Dispatch one Task subagent** whose sole job is to run `/code-review high` over `origin/main...HEAD` and return its findings as a summary (severity + `file:line` + suggested fix). Do **not** run `/code-review` inline, and do **not** add a second review pass — this single pass replaces the old separate `/review`.

- **Blocking**: triage every finding. Fix the valid ones (each as its own commit), then re-run the lean gate. Note any finding you dismiss with a one-line reason for the report.
- For a deeper pass you may note that the user can run the billed `/code-review ultra` (cloud, multi-agent) themselves — Claude cannot launch it.

### 3. Security review (conditional — only on risky paths)

This is a CMS-consuming frontend; the security-relevant surface is API-key/auth handling, the Workers request entry, the browser-exposed env boundary, the live-preview message receiver, edge caching, and external-integration/secret config. Run `/security-review` **only if** the branch diff touches one of those paths:

```bash
git diff --name-only origin/main...HEAD | grep -E \
  '^server/|^pages/preview/|^wrangler\.toml|^vite\.config\.ts|^sentry\.[a-z]+\.config\.ts|^scripts/|^\.env|^\.dev\.vars'
```

| Path | Why it's risky |
| --- | --- |
| `server/` | CMS REST client + API-key auth (`cms-client.ts`, `payload-client.ts`), Workers SSR entry (`entry.ts`), KV cache (`kv-cache.ts`), boundary validation (`validation.ts`) |
| `pages/preview/` | Live-preview route consumes `window.postMessage` from the CMS admin |
| `wrangler.toml` | Worker config, KV bindings, compatibility flags |
| `vite.config.ts` | `envPrefix: 'PUBLIC__'` governs which env vars are embedded in browser bundles — a leak here exposes secrets |
| `sentry.*.config.ts` | Error-reporting DSNs and what gets captured |
| `scripts/` | Build/CI scripts that run with `SAHAJCLOUD_API_KEY` / `GITHUB_TOKEN` in CI |
| `.env*`, `.dev.vars` | Secrets / config |

- **Match** → run `/security-review` over the diff (dispatch a subagent to keep the thread lean), triage + fix its findings (each its own commit), re-run the lean gate.
- **No match** → skip it and say so in the report ("no security-relevant paths changed").

### 4. Lean test gate

```bash
.claude/skills/pr-prep/check.sh          # lint + tsc --noEmit + pnpm test:run
.claude/skills/pr-prep/check.sh --full   # + pnpm build (Cloudflare preview parity)
```

Use `--full` when the branch touches the build, server entry, Vike config, or Wrangler/Cloudflare setup — `pnpm build` is the closest local mirror of the preview deploy. Fix + re-run on failure.

The **smoke** specs (`pnpm test:smoke` for web, `pnpm test:smoke:ladle` for Ladle) run in CI against the *deployed* previews — they need a live `PREVIEW_URL`, so don't run them locally; they're covered by the CI watch in step 8.

### 5. Update documentation

Sync the documentation the branch's changes affect, committed as the **final commit before pushing** (docs ship with the code, not in a follow-up PR). Sweep the branch diff (`origin/main...HEAD`) for what changed and update every stale surface:

- **`CLAUDE.md`** (aliased by `AGENTS.md`) + **`.claude/docs/*`** — architecture, routing/data-fetching, caching, CI/preview, or local-environment facts the diff alters.
- **`.claude/rules/*`** — the path-scoped rule for any subsystem the diff touched (`server/**` CMS reads, repo-wide debugging).
- **`.claude/skills/*`** — the workflow skills themselves, when the diff changes a command, script path, gate, or convention they document.
- **`DESIGN_SYSTEM.md` / `STORYBOOK.md`** for component/story conventions; **`MCP_USAGE.md`** for MCP tooling changes; **`README`** for new commands, env vars, or scripts.
- JSDoc/comments and inline examples referencing anything the diff renamed, removed, or re-flagged — grep the diff for stale references.

Commit it on its own (`docs: <what changed>`). If the update touched lintable files, re-run the lean gate (step 4). If the branch genuinely affects no docs, **say so in the report (step 9)** rather than skipping silently.

### 6. Push

```bash
git push        # first push: git push -u origin <branch>
```

Never force-push a shared branch; never `--no-verify`.

### 7. Open or refresh the PR

```bash
gh pr view --json number,url 2>/dev/null   # does a PR already exist for this branch?
```

Write the body to a **session-unique** temp file (never a fixed `/tmp/pr-body.md` — it collides between parallel Claude instances) from `pr-template.md`:

```bash
BODY_FILE=$(mktemp -t pr-body.XXXXXX).md
# write the body to "$BODY_FILE" (Write tool), then create or edit:
```

- **No PR** → create it:
  ```bash
  gh pr create --title "<conventional commit title>" --body-file "$BODY_FILE" --base main
  ```
- **PR exists** → **refresh** its **title and description** so they reflect the final diff + test results, not the state when it was first opened. Re-derive **both** from the **current** `origin/main...HEAD` — Adjust-phase commits since the last push often change the story (a scope shift, a reverted or newly-added sub-feature, fresh verification), so don't reuse the originals:
  ```bash
  gh pr edit <pr> --title "<conventional commit title, re-derived>" --body-file "$BODY_FILE"
  ```
  Update the title whenever the branch no longer matches it (a feature dropped or added since the last push); keep it only if it's still accurate. Never leave a stale title or description from an earlier state.

### 8. Watch CI and fix (capped)

```bash
gh pr checks <pr-or-branch> --watch
gh pr checks <pr-or-branch>            # confirm final state
```

GitHub checks — all five appear in `gh pr checks`: **Lint, Typecheck & Unit** (the `gate` job), **Smoke (web)** / **Smoke (ladle)** (the smoke matrix), **Workers Builds: wemeditate-web** (the web Vike Worker preview build), and **Cloudflare Pages** (the Ladle preview build). The two Cloudflare build checks report pass/fail with a `dash.cloudflare.com` "Details" link. The deployed web preview **URL** itself is posted in the `cloudflare-workers-and-pages[bot]` PR comment — which **Smoke (web)** discovers and fetch-tests (see `.claude/docs/cloudflare-previews-ci.md`); on a forked PR without that comment, the smoke jobs skip gracefully and stay green.

- **Green** → report.
- **Red** → `gh run view <run-id> --log-failed` for the gate/smoke jobs; for a red **Workers Builds** or **Cloudflare Pages** check, open its `dash.cloudflare.com` build log via the check's "Details". Diagnose, fix locally (re-run the relevant part of the lean gate; reproduce a build failure with `check.sh --full`), commit, push, re-watch. Smoke reds often mean the *deployed* render differs from local (it hits the production CMS) — read the job logs before assuming a code bug.
- **Cap at 3 fix iterations.** If CI is still red after three rounds, **stop and summarize** the remaining failure(s) for the user instead of looping.
- A failure **pre-existing on `main`** (not caused by this branch) → fix it in this PR and note it, per `.claude/skills/pr-prep/SKILL.md`.

### 9. Report

- PR URL + final CI status (green, or the capped-out summary).
- Dismissed review findings (with the one-line reasons).
- Acceptance criteria / behaviour the user should verify manually — UI/visual (check in Ladle), browser behaviour (Puppeteer), content/locale edge cases.
- **Suggest `/reflect-session`** *only if* the session hit notable friction (repeated failed attempts, surprising library behaviour, permission/tooling snags). Don't suggest it for a clean run.
- If the session surfaced a **durable, non-obvious gotcha**, **nudge the user to save it to memory** (the file-based memory under `…/memory/`) so future sessions don't re-derive it.

## Hard rules

- **Never** force-push to `main`/any shared branch; **never** `--no-verify`; **never** commit secrets / `.env`.
- **Never** report success while CI is red.
- **Never** use npm/yarn — pnpm only.
- **Always** run `/simplify` and `/code-review` over the **full branch diff** (`origin/main...HEAD`), not just the last commit.
- **Always** run `/code-review` (and the conditional `/security-review`) via a **dispatched Task subagent**, never inline in the main thread.
- **Always** keep it to a **single** code-review pass — no redundant second review.
- **Always** commit a **documentation sync as the final commit before pushing** (step 5) — update `CLAUDE.md`/`AGENTS.md`, `.claude/docs/*`, `.claude/rules/*`, `.claude/skills/*`, `DESIGN_SYSTEM.md`, `STORYBOOK.md`, `MCP_USAGE.md`, and any example the diff affects; or state in the report that no docs are affected.
- **Always** use `--body-file` (with a `mktemp` path) for `gh pr create` / `gh pr edit`; always refresh a stale PR **title and** body to match the current `origin/main...HEAD`.
- **Cap** the CI fix-loop at 3 iterations, then hand back to the user.

## References

- PR body template: `pr-template.md`
- Lean / `--full` gate + pre-existing-failure handling: `.claude/skills/pr-prep/SKILL.md` (shared script: `.claude/skills/pr-prep/check.sh`)
- 3-phase PR workflow: `CLAUDE.md` → "PR Workflow (3 Phases)" (aliased by `AGENTS.md`)
- CI + the two Cloudflare previews: `.claude/docs/cloudflare-previews-ci.md`
- Commit conventions (HEREDOC + `Co-Authored-By`): `.claude/skills/draft-ticket/conventions.md`, `CLAUDE.md`
