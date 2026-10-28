import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { compile } from 'tailwindcss'
import {
  layoutsDir,
  loadTailwindStylesheet,
  repoRoot,
  themeStylesheet,
} from '../tests/guards/_source-scan'
import { OrnateTextBox } from '../components/organisms/OrnateTextBox/OrnateTextBox'
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

describe('an arbitrary value written out, not interpolated', () => {
  // Tailwind emits an arbitrary value only for a candidate it finds verbatim
  // in a scanned file. Interpolating the band's angle or its alphas renders
  // the same class string, so the component's own assertions stay green while
  // the stylesheet loses the rule and the band draws as a bare transparent
  // box (#193).
  // Reading the source stands in for the `@source` scan, which this harness
  // bypasses by handing `build` its candidates.
  const source = readFileSync(
    join(repoRoot, 'components/organisms/OrnateTextBox/OrnateTextBox.tsx'),
    'utf8',
  )

  // `-top-24` is the warm band's alone; the brown ground is a gradient too.
  // Each align carries two: the faint one below `lg`, and the `lg:` override
  // at full strength.
  const bandCandidate = (align: 'left' | 'right', prefix: '' | 'lg:') =>
    (
      renderToStaticMarkup(
        createElement(OrnateTextBox, {
          align,
          description: 'In every culture one can find tales of timeless wisdom.',
          imageAlt: 'Artwork',
          imageSrc: 'https://picsum.photos/seed/x/900/1200',
          title: 'Sacred Teachings',
        }),
      ).match(/class="([^"]*-top-24[^"]*)"/)?.[1] ?? ''
    )
      .split(' ')
      .find((candidate) => candidate.startsWith(`${prefix}bg-[linear-gradient`)) ?? ''

  // The peach alpha identifies the intensity, so a faint case cannot pass on
  // the full-strength candidate.
  it.each([
    ['faint left', 'left', '90deg', '', '0.08'],
    ['full left', 'left', '90deg', 'lg:', '0.6'],
    ['faint right', 'right', '270deg', '', '0.08'],
    ['full right', 'right', '270deg', 'lg:', '0.6'],
  ] as const)(
    'compiles the %s ornate band from its own source',
    async (_name, align, angle, prefix, peach) => {
      const candidate = bandCandidate(align, prefix)

      expect(candidate).toContain(angle)
      expect(candidate).toContain(`rgba(255,196,175,${peach})_100%`)
      expect(source).toContain(candidate)
      expect(await build([candidate])).toContain(`background-image: linear-gradient(${angle},`)
    },
  )
})
