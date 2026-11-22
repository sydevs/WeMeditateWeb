/**
 * What `pnpm lint` and `prettier --write .` reach.
 *
 * `pnpm lint` fails on a single warning, and Claude Code checks out whole branches under
 * `.claude/worktrees/`. Prettier learns that from .gitignore; ESLint does not, so without its own
 * ignore the gate fails on another branch's warnings, and `eslint --fix` rewrites that branch.
 * Prettier's own ignores leave generated files to their generators, Markdown's code samples
 * intact, and a protected path to an attended write. Those ignores are load-bearing because
 * `pnpm lint` ends in `prettier --check .`: ESLint's prettier rule reaches only the files ESLint
 * lints, which leaves the CSS, the JSONC and the JSON this repo also formats unheld.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import { getFileInfo } from 'prettier'

const root = fileURLToPath(new URL('../../', import.meta.url))

describe('ESLint', () => {
  const eslint = new ESLint({ cwd: root })

  it('leaves a worktree under .claude/ to its own branch', async () => {
    expect(await eslint.isPathIgnored('.claude/worktrees/some-branch/lib/urls/urls.ts')).toBe(true)
  })

  it('still lints the app and its tooling', async () => {
    expect(await eslint.isPathIgnored('lib/urls/urls.ts')).toBe(false)
    expect(await eslint.isPathIgnored('scripts/a11y-summary.mjs')).toBe(false)
  })
})

describe('Prettier', () => {
  const ignored = async (path: string) =>
    (await getFileInfo(`${root}${path}`, { ignorePath: `${root}.prettierignore` })).ignored

  it.each([
    'types/payload/payload-types.ts',
    'lib/i18n/translations.en.json',
    'pnpm-lock.yaml',
    '.mcp.json',
    'AGENTS.md',
    'docs/rules/design-system.md',
  ])('leaves %s alone', async (path) => {
    expect(await ignored(path)).toBe(true)
  })

  it('formats the app', async () => {
    expect(await ignored('lib/urls/urls.ts')).toBe(false)
  })
})

describe('the lint script', () => {
  const lint = JSON.parse(readFileSync(`${root}package.json`, 'utf8')).scripts.lint as string

  it('holds every formatted file, not only the ones ESLint lints', () => {
    expect(lint).toContain('prettier --check .')
  })

  it('still fails on a single ESLint warning', () => {
    expect(lint).toContain('--max-warnings 0')
  })
})
