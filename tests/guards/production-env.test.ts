/**
 * A `PUBLIC__` value the deployed site needs lives in `.env.production`.
 *
 * Vite inlines `import.meta.env.PUBLIC__*` while it builds, and nothing reads a `PUBLIC__` binding
 * from the running Worker, so `wrangler.toml`'s `[vars]` never reach the code that uses them. The
 * status page URL lived only there, and the deployed error page compiled it as `undefined`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { describe, it, expect } from 'vitest'
import { isSafeHttpUrl } from '../../lib/urls'
import { repoRoot } from './_source-scan'

const production = parseEnv(readFileSync(join(repoRoot, '.env.production'), 'utf8'))

/**
 * The `PUBLIC__` entries of `wrangler.toml`'s `[vars]` table, which ends at the next header.
 * None at all is a valid answer; a `PUBLIC__` line this cannot read throws, so a format change
 * cannot empty the list and leave the guard passing on nothing.
 */
function wranglerPublicVars(): [string, string][] {
  const lines = readFileSync(join(repoRoot, 'wrangler.toml'), 'utf8').split('\n')
  const table = lines.indexOf('[vars]')

  if (table === -1) return []
  const end = lines.findIndex((line, i) => i > table && line.startsWith('['))

  return lines
    .slice(table + 1, end === -1 ? undefined : end)
    .filter((line) => line.startsWith('PUBLIC__'))
    .map((line) => {
      const entry = line.match(/^(PUBLIC__\w+)\s*=\s*"([^"]*)"$/)

      if (!entry) throw new Error(`wrangler.toml [vars]: cannot read \`${line}\``)

      return [entry[1], entry[2]]
    })
}

describe('.env.production', () => {
  it('carries the status page the error page links to', () => {
    expect(isSafeHttpUrl(production.PUBLIC__STATUS_PAGE_URL ?? '')).toBe(true)
  })

  it('holds every PUBLIC__ value wrangler.toml declares, with the same value', () => {
    for (const [name, value] of wranglerPublicVars()) expect(production[name], name).toBe(value)
  })
})
