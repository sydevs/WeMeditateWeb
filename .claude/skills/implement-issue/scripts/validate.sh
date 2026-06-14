#!/bin/bash
#
# Validate that the current branch is ready to open a PR.
#
# WeMeditateWeb has no test/lint CI — its only PR check is the Cloudflare
# preview deployment — so this local gate is the substantive quality bar.
#
# Default (lean gate): lint + type-check + the Vitest suite.
#   - pnpm lint
#   - pnpm exec tsc --noEmit
#   - pnpm test:run
#
# --full: the lean gate PLUS the production build (`pnpm build`, i.e. vike
# build), which is the closest local mirror of what the Cloudflare preview
# deployment runs. Use it before pushing build/server/Wrangler changes, or to
# reproduce a red preview build. Runs SEQUENTIALLY.
#
# Usage:
#   .claude/skills/implement-issue/scripts/validate.sh           # lint + tsc + test:run
#   .claude/skills/implement-issue/scripts/validate.sh --full    # + pnpm build

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
MODE="${1:-}"

cd "$PROJECT_DIR" || exit 1

START_TIME=$(date +%s)

echo "=== Lint ==="
if ! pnpm lint; then
  echo
  echo "❌ Lint failed. Fix lint errors before continuing."
  exit 1
fi
echo "✓ Lint passed"
echo

echo "=== Type-check (tsc --noEmit) ==="
if ! pnpm exec tsc --noEmit; then
  echo
  echo "❌ Type errors. Fix them before continuing."
  exit 1
fi
echo "✓ Types passed"
echo

echo "=== Tests (vitest run) ==="
if ! pnpm test:run; then
  echo
  echo "❌ Tests failed. Fix failing tests before continuing."
  exit 1
fi
echo "✓ Tests passed"
echo

if [[ "$MODE" == "--full" ]]; then
  echo "=== Production build (Cloudflare preview parity) ==="
  if ! pnpm build; then
    echo
    echo "❌ Build failed. The Cloudflare preview deploy will fail too — fix it."
    exit 1
  fi
  echo "✓ Build passed"
  echo
else
  echo "ℹ Lean gate only. Run with --full to also run 'pnpm build' (mirrors the"
  echo "  Cloudflare preview deployment) before pushing build/server/Wrangler changes."
  echo
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo "=== ✓ Checks passed — ${ELAPSED}s ==="
