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

/** The `PUBLIC__` entries of `wrangler.toml`'s `[vars]` table, which ends at the next header. */
function wranglerPublicVars(): [string, string][] {
  const lines = readFileSync(join(repoRoot, 'wrangler.toml'), 'utf8').split('\n')
  const start = lines.indexOf('[vars]') + 1
  const end = lines.findIndex((line, i) => i >= start && line.startsWith('['))

  return lines.slice(start, end === -1 ? undefined : end).flatMap((line) => {
    const entry = line.match(/^(PUBLIC__\w+)\s*=\s*"([^"]*)"$/)

    return entry ? [[entry[1], entry[2]] as [string, string]] : []
  })
}

describe('.env.production', () => {
  it('carries the status page the error page links to', () => {
    expect(isSafeHttpUrl(production.PUBLIC__STATUS_PAGE_URL ?? '')).toBe(true)
  })

  it('holds every PUBLIC__ value wrangler.toml declares, with the same value', () => {
    const declared = wranglerPublicVars()

    expect(declared.length).toBeGreaterThan(0)
    for (const [name, value] of declared) expect(production[name], name).toBe(value)
  })
})
