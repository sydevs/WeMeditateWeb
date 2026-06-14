#!/usr/bin/env node

/**
 * TypeScript Type-Checking Hook (PostToolUse / Edit|Write)
 *
 * Runs `tsc --noEmit` after editing a .ts/.tsx file and surfaces any type
 * errors that mention the edited file. Silent on success. Note: tsc checks the
 * whole project, so this scales with project size.
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

if (!filePath || !/\.(ts|tsx)$/.test(filePath)) {
  process.exit(0)
}

const res = spawnSync('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false'], {
  cwd: process.env.CLAUDE_PROJECT_DIR,
  encoding: 'utf-8',
})

if (res.status === 0) {
  process.exit(0)
}

const output = `${res.stdout || ''}${res.stderr || ''}`
const projectDir = process.env.CLAUDE_PROJECT_DIR || ''
const rel = filePath.startsWith(projectDir + '/') ? filePath.slice(projectDir.length + 1) : filePath

// tsc prints project-relative paths; match on both the relative and absolute form
// so we only surface errors for the file Claude just edited.
const relevant = output
  .split('\n')
  .filter((line) => line.includes(rel) || line.includes(filePath))
  .join('\n')
  .trim()

if (relevant) {
  console.error(`TypeScript errors in ${rel}:\n\n${relevant}\n\nPlease fix these type errors.`)
  process.exit(2)
}

// Type errors exist elsewhere but not in this file — stay silent to avoid noise.
process.exit(0)
