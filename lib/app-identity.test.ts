import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  APP_STORE_ID,
  APP_STORE_URL,
  PLAY_STORE_ID,
  PLAY_STORE_URL,
  THEME_COLOR,
} from './app-identity'

describe('app-identity', () => {
  it('builds each store URL from the id that store keys on', () => {
    expect(APP_STORE_URL).toContain(APP_STORE_ID)
    expect(PLAY_STORE_URL).toContain(PLAY_STORE_ID)
  })

  it('keeps the theme colour equal to the stylesheet it restates', () => {
    // A meta tag cannot read a CSS custom property, so the value is restated.
    // This is what stops the two drifting.
    const css = readFileSync(join(import.meta.dirname, '../layouts/tailwind.css'), 'utf8')
    const teal = css.match(/--color-teal-600:\s*(#[0-9a-f]{6})/i)?.[1]

    expect(teal).toBeTruthy()
    expect(THEME_COLOR.toLowerCase()).toBe(teal?.toLowerCase())
  })
})
