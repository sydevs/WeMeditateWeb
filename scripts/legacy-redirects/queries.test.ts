import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { QUERIES } from './queries'

const readme = readFileSync(
  new URL('../../data/legacy-redirects/README.md', import.meta.url),
  'utf8',
)

describe('export queries', () => {
  it('are all in the README verbatim', () => {
    for (const sql of Object.values(QUERIES)) expect(readme).toContain(sql)
  })

  it('only read', () => {
    for (const sql of Object.values(QUERIES)) {
      expect(sql).toMatch(/^select /)
      expect(sql).not.toMatch(/\b(insert|update|delete|drop|alter|create|truncate|grant)\b/i)
    }
  })

  it('never select a user column', () => {
    for (const sql of Object.values(QUERIES)) expect(sql).not.toMatch(/\b(email|password|users)\b/i)
  })
})
