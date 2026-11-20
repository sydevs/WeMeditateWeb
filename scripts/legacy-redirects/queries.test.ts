import { describe, expect, it } from 'vitest'

import { QUERIES } from './queries'

describe('export queries', () => {
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
