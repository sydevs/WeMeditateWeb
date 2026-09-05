#!/bin/bash
#
# Validate that the current branch is ready to open a PR.
#
# CI (.github/workflows/ci.yml) re-runs lint, type-check, and the unit suite
# on every PR. This local gate runs the same checks first, to keep the loop
# fast.
#
# Default (lean gate): lint + type-check + the Vitest suite.
#   - pnpm lint
#   - pnpm exec tsc --noEmit
#   - pnpm test:run
#
# --full: the lean gate, plus the production build (`pnpm build`, the vike
# build). This is the closest local match to what the Cloudflare preview
# deployment runs. Use it before you push build, server, or Wrangler
# changes, or to reproduce a red preview build. It runs the checks in
# sequence.
#
# Usage:
#   .claude/skills/pr-prep/check.sh           # lint + tsc + test:run
#   .claude/skills/pr-prep/check.sh --full    # + pnpm build

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
