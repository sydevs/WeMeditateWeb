/**
 * What `pnpm lint` and `prettier --write .` reach.
 *
 * `pnpm lint` fails on a single warning, and Claude Code checks out whole branches under
 * `.claude/worktrees/`. Prettier learns that from .gitignore; ESLint does not, so without its own
 * ignore the gate fails on another branch's warnings, and `eslint --fix` rewrites that branch.
 * Prettier's own ignores leave generated files to their generators and Markdown's code samples
 * intact.
 */
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import { getFileInfo } from 'prettier'

const root = fileURLToPath(new URL('../../', import.meta.url))

describe('ESLint', () => {
  const eslint = new ESLint({ cwd: root })

  it('leaves a worktree under .claude/ to its own branch', async () => {
    expect(await eslint.isPathIgnored('.claude/worktrees/some-branch/lib/urls.ts')).toBe(true)
  })

  it('still lints the app and its tooling', async () => {
    expect(await eslint.isPathIgnored('lib/urls.ts')).toBe(false)
    expect(await eslint.isPathIgnored('scripts/a11y-summary.mjs')).toBe(false)
  })
})

describe('Prettier', () => {
  const ignored = async (path: string) =>
    (await getFileInfo(`${root}${path}`, { ignorePath: `${root}.prettierignore` })).ignored

  it.each([
    'server/payload-types.ts',
    'lib/translations.en.json',
    'pnpm-lock.yaml',
    'AGENTS.md',
    'docs/rules/design-system.md',
  ])('leaves %s alone', async (path) => {
    expect(await ignored(path)).toBe(true)
  })

  it('formats the app', async () => {
    expect(await ignored('lib/urls.ts')).toBe(false)
  })
})
