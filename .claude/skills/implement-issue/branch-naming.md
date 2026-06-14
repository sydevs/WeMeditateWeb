# Branch naming

## Format

```
<type>/<short-kebab-slug>
```

`<type>` matches the conventional commit type (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`).

`<short-kebab-slug>` is 2–5 words drawn from the issue title.

## Examples

| Issue title                                                   | Branch                          |
| ------------------------------------------------------------- | ------------------------------- |
| `Lectures: HLS video renderer, routes & live preview`        | `feat/lectures-hls-renderer`    |
| `fix(cms): send select + populate on all API client reads`   | `fix/cms-select-populate`       |
| `Pages: baseline rich-text renderer`                         | `feat/pages-richtext-renderer`  |
| `feat: Cloudflare Images integration with predefined variants` | `feat/cloudflare-images`      |
| `chore(claude): audit and rewrite hook config`               | `chore/claude-hooks-audit`      |
| `Fix meditation player frame selection`                      | `fix/meditation-frame-selection`|

## Rules

- Lowercase, kebab-case
- No issue numbers in the branch name (they go in the commit body)
- 2–5 words from the title — long enough to be recognizable, short enough to type
- Drop articles ("the", "a") and filler words
- If the issue has no clear scope, use the area (`cms`, `player`, `preview`, `images`, `components`, ...)

## Branch from where

Always from latest `main` unless the user says otherwise:

```bash
git fetch origin main
git checkout main
git pull
git checkout -b <type>/<slug>
```

## When the branch name is taken

If `git checkout -b` fails because the branch exists locally or remotely:

- **Local exists, no commits:** delete it (`git branch -d`) and re-create
- **Local exists with commits:** ask the user — they may have unfinished work
- **Remote exists:** ask the user — may be an existing PR

Never silently force-overwrite an existing branch.
