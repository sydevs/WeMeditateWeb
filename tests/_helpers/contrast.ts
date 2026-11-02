/**
 * WCAG contrast, and the theme's own hex for a scale step.
 *
 * Two specs measure the same thing from different ends — `layouts/tailwind.test.ts`
 * on the surface tokens, `tests/guards/text-contrast.test.ts` on the scale steps a
 * component names outright — so the formula and the palette lookup live here
 * rather than once per spec, where they could disagree about a borderline pair.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const stylesheet = readFileSync(join(repoRoot, 'layouts', 'tailwind.css'), 'utf8')

/** `--color-teal-700: #3d726b;` → `teal-700` → `#3d726b`. */
const PALETTE = new Map<string, string>(
  [...stylesheet.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)].map(
    ([, token, hex]) => [token.toLowerCase(), hex.toLowerCase()],
  ),
)

/**
 * The hex a colour name resolves to: a theme token by name, `white` and `black`
 * from Tailwind's own defaults, or a literal `#rrggbb` passed straight through.
 */
export function hex(color: string): string {
  if (color.startsWith('#')) return color.toLowerCase()
  if (color === 'white') return '#ffffff'
  if (color === 'black') return '#000000'

  const found = PALETTE.get(color)

  if (!found) throw new Error(`no --color-${color} in layouts/tailwind.css`)

  return found
}

/** Whether `hex` can resolve this name — `transparent` and `bg-[…]` cannot. */
export function isColor(color: string): boolean {
  return color.startsWith('#') || color === 'white' || color === 'black' || PALETTE.has(color)
}

/** WCAG 2.1 relative-luminance contrast between two colours `hex` accepts. */
export function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const full = color.length === 4 ? color.replace(/\w/g, (c) => c + c) : color
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(full.slice(i, i + 2), 16) / 255

      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [luminance(hex(a)), luminance(hex(b))].sort((x, y) => y - x)

  return (hi + 0.05) / (lo + 0.05)
}
