import { describe, it, expect } from 'vitest'
import { idSchema } from './validation'

describe('idSchema', () => {
  it('refuses an id past Postgres int4, which SahajCloud answers with a 500', () => {
    expect(idSchema.parse('2147483647')).toBe('2147483647')
    expect(idSchema.safeParse('9999999999').success).toBe(false)
  })
})
