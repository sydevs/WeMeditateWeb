---
name: pr-prep
description: Pre-PR validation — runs the lean local gate (lint + type-check + Vitest) by default, with --full to also run the production build that the Cloudflare preview deployment runs. Use before opening or marking a PR ready for review.
allowed-tools: Bash, Read, Grep
---

# PR Prep

Validates that the current branch is PR-ready for **WeMeditateWeb**.

CI (`.github/workflows/ci.yml`) re-runs lint + type-check + the unit suite on every PR, plus a smoke matrix and two Cloudflare preview builds. Running this lean gate **locally first** keeps the implement loop fast — catch failures before they reach CI, not after.

| Gate            | Command                                              | What it catches                          |
| --------------- | --------------------------------------------------- | ---------------------------------------- |
| **Lean (default)** | `pnpm lint` + `pnpm exec tsc --noEmit` + `pnpm test:run` | Lint, type, and logic regressions        |
| **Full (`--full`)** | the lean gate **+ `pnpm build`**                  | Build/SSR/Workers-bundle failures (mirrors the preview deploy) |

## Quick start

Reuses the shared validation script (do not duplicate it):

```bash
.claude/skills/implement-issue/scripts/validate.sh          # lean: lint + tsc + test:run
.claude/skills/implement-issue/scripts/validate.sh --full   # + pnpm build (Cloudflare preview parity)
```

Runs sequentially.

## When to use `--full`

Run `--full` before pushing anything that touches the build, the server entry, Vike config, Wrangler/Cloudflare config, or dependencies — `pnpm build` (vike build) is the closest local mirror of what the preview deployment runs, and a green local build is the best predictor of a green preview check.

## Handling pre-existing failures on `main`

If lint / type / test failures already exist on `main` (not caused by your branch):

- **Don't ignore them** — fix as part of your PR, in a separate commit if unrelated to your feature.
- Document the fix in the PR description.

### Fast verification recipe

Confirm a failure pre-exists on `main` without losing working changes:

```bash
git stash
git checkout main -- <path/to/suspect/file>
pnpm exec tsc --noEmit        # or: pnpm test:run / pnpm lint
# observe the same failure → it's pre-existing
git checkout HEAD -- <path/to/suspect/file>
git stash pop
```

Swaps just the suspect file to its `main` version, re-checks, then restores everything.

## PR description format

Include a Test Results section (see `.claude/skills/finalize-pr/pr-template.md`):

```markdown
## Test Results

- Lint: ✓ No errors (`pnpm lint`)
- Types: ✓ Clean (`pnpm exec tsc --noEmit`)
- Tests: ✓ X passed (`pnpm test:run`)
- Build: ✓ Success (`pnpm build`) — or "N/A — no build-affecting changes"

## Preview deployment

- Cloudflare preview: ✓ deployed
```

## When NOT to use this skill

- During focused implementation — the PostToolUse hooks already run ESLint `--fix` and `tsc --noEmit` on each edited file. For ad-hoc checks, run `pnpm lint` / `pnpm test:run` / a single `pnpm exec vitest run <file>` directly.
- Use this skill specifically before opening or marking-ready a PR.

## References

- Shared validation script: `.claude/skills/implement-issue/scripts/validate.sh`
- Full issue→PR workflow: `.claude/skills/implement-issue/SKILL.md`
- Finalize / ship pipeline (uses this lean gate): `.claude/skills/finalize-pr/SKILL.md`
- 3-phase PR workflow: CLAUDE.md "PR Workflow (3 Phases)"
- Testing approach: CLAUDE.md "Testing" section
