import { describe, it, expect } from 'vitest'
import { isoDuration } from './structured-data'

describe('isoDuration', () => {
  it.each([
    [1200, 'PT20M'],
    [45, 'PT45S'],
    [3661, 'PT1H1M1S'],
    [3600, 'PT1H'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(isoDuration(seconds)).toBe(expected)
  })

  it.each([0, -5, Number.NaN])('answers null for %p, so the field is dropped', (seconds) => {
    expect(isoDuration(seconds)).toBeNull()
  })
})
