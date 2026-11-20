import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { APP_ICON, APP_ICON_SIZE, THEME_COLOR } from './site-identity'
import { pngSize } from '../tests/_helpers/png'

describe('site-identity', () => {
  it('keeps the theme colour equal to the stylesheet it restates', () => {
    const css = readFileSync(join(import.meta.dirname, '../layouts/tailwind.css'), 'utf8')
    const teal = css.match(/--color-teal-600:\s*(#[0-9a-f]{6})/i)?.[1]

    expect(teal).toBeTruthy()
    expect(THEME_COLOR.toLowerCase()).toBe(teal?.toLowerCase())
  })

  it("declares the icon asset's own pixels, so the manifest cannot lie", () => {
    expect(pngSize(join(import.meta.dirname, '../public', APP_ICON))).toEqual({
      width: APP_ICON_SIZE,
      height: APP_ICON_SIZE,
    })
  })
})
