import { describe, it, expect } from 'vitest'
import { compile } from 'tailwindcss'
import {
  layoutsDir,
  loadTailwindStylesheet,
  themeStylesheet,
} from '../tests/guards/_source-scan'

import { contrast } from '../tests/_helpers/contrast'

/** Compiles the real stylesheet for the given class candidates. */
async function build(candidates: string[]): Promise<string> {
  const compiler = await compile(themeStylesheet, {
    base: layoutsDir,
    loadStylesheet: loadTailwindStylesheet,
  })

  return compiler.build(candidates)
}

/** Every declaration under `selector`, across all the blocks that use it. */
const rule = (css: string, selector: string): string =>
  [
    ...css.matchAll(
      new RegExp(`(?:^|[\\s}])${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g'),
    ),
  ]
    .map(([, block]) => block)
    .join('')

const declared = (block: string, property: string): string =>
  block.match(new RegExp(`${property}:\\s*([^;]+);`))?.[1].trim() ?? ''

const props = (block: string): string[] =>
  [...block.matchAll(/(--surface-[\w-]+):/g)].map(([, name]) => name).sort()

/** A surface token's value as a hex, following one `var(--color-*)` hop. */
const resolve = (css: string, value: string): string => {
  const name = value.match(/^var\((--color-[\w-]+)\)$/)?.[1]

  return name ? declared(css, name) : value
}

describe('surfaces', () => {
  // Without `@theme inline`, `--color-fg` resolves once at `:root`, and a
  // nested `surface-dark` could never change what `text-fg` draws.
  it('resolve a token at the element, not at :root', async () => {
    const css = await build(['text-fg', 'border-line', 'bg-tint'])

    expect(declared(rule(css, '.text-fg'), 'color')).toBe('var(--surface-fg)')
    expect(declared(rule(css, '.border-line'), 'border-color')).toBe('var(--surface-line)')
    expect(declared(rule(css, '.bg-tint'), 'background-color')).toBe('var(--surface-tint)')
  })

  // A token one surface forgets would inherit the other surface's value.
  it('define the same tokens on light, dark and :root', async () => {
    const css = await build(['surface-light', 'surface-dark'])
    const light = props(rule(css, '.surface-light'))

    expect(light.length).toBeGreaterThan(10)
    expect(props(rule(css, '.surface-dark'))).toEqual(light)
    expect(props(rule(css, ':root'))).toEqual(light)
  })

  // The light surface's own background: `--color-bg-warm` is declared but has
  // no call site, which `blockConverters.test.tsx` asserts, so white is the
  // only light background a surface token is read against.
  //
  // 4.5:1 is WCAG 2.1 SC 1.4.3 for normal-size text. Every one of these drew
  // text under it before #179 — `gray-700` 4.23, `teal-600` 3.85.
  it.each([
    ['--surface-fg', '#fff'],
    ['--surface-fg-muted', '#fff'],
    ['--surface-primary', '#fff'],
    ['--surface-primary-strong', '#fff'],
    ['--surface-secondary', '#fff'],
    ['--surface-secondary-strong', '#fff'],
    ['--surface-on-highlight', '--surface-highlight'],
  ])('clear 4.5:1 for %s on light', async (token, against) => {
    const css = await build(['surface-light'])
    const block = rule(css, '.surface-light')
    const text = resolve(css, declared(block, token))
    const background = against.startsWith('--') ? resolve(css, declared(block, against)) : against

    expect(text).toMatch(/^#/)
    expect(background).toMatch(/^#/)
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('focus-ring', () => {
  // A ring colour alone compiles to `--tw-ring-color` and no `box-shadow` —
  // `Link` shipped eight of them that drew nothing (#133).
  it('draws a ring, only on :focus-visible', async () => {
    const css = await build(['focus-ring'])
    const block = rule(css, '.focus-ring:focus-visible')

    expect(block).toContain('box-shadow:')
    expect(declared(block, '--tw-ring-color')).toBe('var(--surface-ring)')
    expect(declared(block, '--tw-ring-offset-color')).toBe('var(--surface-ring-offset)')
    expect(declared(block, 'outline-style')).toBe('none')
    expect(rule(css, '.focus-ring')).toBe('')
  })

  // The ring must clear the 3:1 of WCAG 2.1 SC 1.4.11 against the band it sits
  // on. `teal-500`, the colour it replaced, measures 2.70 on white.
  it('clears 3:1 against its own offset band on every surface', async () => {
    const css = await build(['surface-light', 'surface-dark'])

    for (const block of [
      rule(css, ':root'),
      rule(css, '.surface-light'),
      rule(css, '.surface-dark'),
    ]) {
      const ring = resolve(css, declared(block, '--surface-ring'))
      const band = resolve(css, declared(block, '--surface-ring-offset'))

      expect(ring).toMatch(/^#/)
      expect(band).toMatch(/^#/)
      expect(contrast(ring, band)).toBeGreaterThanOrEqual(3)
    }
  })

  it('rings white on a dark surface, which clears 3:1 on all of them', async () => {
    const css = await build(['surface-dark'])

    expect(declared(rule(css, '.surface-dark'), '--surface-ring')).toBe('#fff')
  })
})
