# AGENTS.md

This repository's agent and contributor guidance lives in **[CLAUDE.md](CLAUDE.md)** — the single source of truth for architecture, conventions, the design system, testing, and the PR workflow. `AGENTS.md` is an alias so tools that look for it are pointed to the canonical guide.

**Read [CLAUDE.md](CLAUDE.md).**

Frequently needed:

- **PR workflow (Implement → Adjust → Finalize)** — [CLAUDE.md → "PR Workflow (3 Phases)"](CLAUDE.md#pr-workflow-3-phases). The three phases batch CI runs. During the **Adjust** phase, commit follow-up changes locally as you go but **do not push**; run `/finalize-pr` to ship the batch (push + one CI run).
- **Skills** — from the `workflow` plugin (`sydevs/claude-workflow`): `/workflow:draft-ticket`, `/workflow:implement-issue`, `/workflow:finalize-pr`, `/workflow:cross-repo-issue`, `/workflow:dev-server`. Per-repo settings in [.claude/workflow.json](.claude/workflow.json); the lean gate itself stays local at [.claude/skills/pr-prep/check.sh](.claude/skills/pr-prep/check.sh).
- **Commit / PR conventions** — conventional commits; derive the scopes in use from `git log --oneline -50`.
- **Scoped rules & docs** — nested `CLAUDE.md` files ([server/CLAUDE.md](server/CLAUDE.md)) carry the directives to follow, loaded when Claude reads files in that directory; [docs/](docs/) holds the reference material.
