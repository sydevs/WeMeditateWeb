import { describe, it, expect } from 'vitest'
import { formatDuration } from './duration'

describe('formatDuration', () => {
  it('renders a whole minute with no remainder', () => {
    expect(formatDuration(120)).toBe('2:00')
  })

  it('zero-pads a seconds value below ten', () => {
    expect(formatDuration(5)).toBe('0:05')
    expect(formatDuration(65)).toBe('1:05')
  })

  it('truncates a fractional second rather than rounding it up', () => {
    // `currentTime` arrives fractional, so 89.9s must still read 1:29.
    expect(formatDuration(89.9)).toBe('1:29')
  })

  it('renders a non-finite duration as 0:00', () => {
    expect(formatDuration(Infinity)).toBe('0:00')
    expect(formatDuration(NaN)).toBe('0:00')
  })
})
