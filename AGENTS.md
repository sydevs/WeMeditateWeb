# AGENTS.md

This repository's agent and contributor guidance lives in **[CLAUDE.md](CLAUDE.md)** — the single source of truth for architecture, conventions, the design system, testing, and the PR workflow. `AGENTS.md` is an alias so tools that look for it are pointed to the canonical guide.

**Read [CLAUDE.md](CLAUDE.md).**

Frequently needed:

- **PR workflow (Implement → Adjust → Finalize)** — [CLAUDE.md → "PR Workflow (3 Phases)"](CLAUDE.md#pr-workflow-3-phases). The three phases batch CI runs. During the **Adjust** phase, commit follow-up changes locally as you go but **do not push**; run `/finalize-pr` to ship the batch (push + one CI run).
- **Skills** — [.claude/skills/](.claude/skills/): `implement-issue` (phase 1), `finalize-pr` (phase 3, also reused by phase 1), `pr-prep` (the lean gate), `draft-ticket`, `reflect-session`.
- **Commit / PR conventions** — [.claude/skills/draft-ticket/conventions.md](.claude/skills/draft-ticket/conventions.md).
- **Scoped rules & docs** — [.claude/rules/](.claude/rules/) (directives to follow) and [.claude/docs/](.claude/docs/) (reference), each declaring its scope via `globs` frontmatter.
