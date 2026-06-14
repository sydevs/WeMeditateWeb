#!/usr/bin/env node

/**
 * ESLint Hook (PostToolUse / Edit|Write)
 *
 * Auto-fixes the edited JS/TS file with ESLint (which also applies Prettier via
 * eslint-plugin-prettier). Surfaces any remaining unfixable errors to Claude.
 * Silent on success.
 */

import { readFileSync } from 'fs'
import { spawnSync } from 'child_process'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf-8'))
} catch {
  process.exit(0)
}

// Claude Code nests the path under tool_input.file_path; tolerate a top-level fallback.
const filePath = input?.tool_input?.file_path ?? input?.filePath

if (!filePath || !/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(filePath)) {
  process.exit(0)
}

const res = spawnSync('pnpm', ['exec', 'eslint', '--fix', filePath], {
  cwd: process.env.CLAUDE_PROJECT_DIR,
  encoding: 'utf-8',
})

const output = `${res.stdout || ''}${res.stderr || ''}`.trim()

// ESLint exits non-zero only when errors remain after --fix (warnings alone don't).
if (res.status && res.status !== 0 && output) {
  console.error(
    `ESLint reported unresolved problems in ${filePath} (auto-fix applied what it could):\n\n${output}\n\nPlease fix these.`,
  )
  process.exit(2)
}

process.exit(0)
