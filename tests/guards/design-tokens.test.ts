/**
 * Every colour token `DESIGN_SYSTEM.md` names, and every hex it gives, must
 * match `layouts/tailwind.css`.
 *
 * The doc restates the `@theme` block, so the two can drift apart silently —
 * and did: #172 found 13 token names declared nowhere and two wrong hex
 * values, and sydevs/SahajCloud#862 was the same failure in another guide.
 * Nothing but this guard holds the copy to its source.
 *
 * It parses the doc rather than the rendered page, so it covers the tables
 * without building anything.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from './_source-scan'

const doc = readFileSync(join(repoRoot, 'DESIGN_SYSTEM.md'), 'utf8')
const stylesheet = readFileSync(join(repoRoot, 'layouts', 'tailwind.css'), 'utf8')

/** `--color-teal-500: #61aaa0;` inside the `@theme` block. */
const DECLARED = new Map<string, string>(
  [...stylesheet.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)].map(([, token, hex]) => [
    token,
    hex.toLowerCase(),
  ]),
)

/** Every `--color-*` the doc mentions, in prose or in a table. */
const MENTIONED = new Set([...doc.matchAll(/--color-[a-z0-9-]+/gi)].map(([token]) => token))

/**
 * The hex the doc states for a token, from either table shape.
 *
 * The ramp is a pivot — one row per step, one column per scale — so its
 * token names exist only as a header cell plus a row label. The standalone
 * table names its token outright.
 */
function statedHexes(): Map<string, string> {
  const stated = new Map<string, string>()

  const pivot = doc.match(/^\|\s*Step\s*\|([^\n]*)\|[^\n]*\n\|[-\s|]+\|\n((?:\|[^\n]*\n)+)/m)
  if (pivot) {
    const scales = pivot[1]
      .split('|')
      .map((cell) => cell.trim().toLowerCase())
      .filter(Boolean)

    for (const row of pivot[2].trim().split('\n')) {
      const cells = row.split('|').map((cell) => cell.trim().replace(/`/g, ''))
      const step = cells[1]

      scales.forEach((scale, index) => {
        const hex = cells[index + 2]
        if (/^#[0-9a-f]{3,8}$/i.test(hex)) stated.set(`--color-${scale}-${step}`, hex.toLowerCase())
      })
    }
  }

  for (const [, token, hex] of doc.matchAll(
    /^\|\s*`(--color-[a-z0-9-]+)`\s*\|\s*`(#[0-9a-f]{3,8})`/gim,
  )) {
    stated.set(token, hex.toLowerCase())
  }

  return stated
}

const STATED = statedHexes()

describe('DESIGN_SYSTEM.md colour tokens', () => {
  it('finds the tables to check (the guard is not silently empty)', () => {
    expect(DECLARED.size).toBeGreaterThan(30)
    expect(MENTIONED.size).toBeGreaterThan(10)
    expect(STATED.size).toBeGreaterThan(30)
  })

  it('gives a hex for every token the theme declares', () => {
    const undocumented = [...DECLARED.keys()].filter((token) => !STATED.has(token)).sort()

    expect(undocumented, `missing from the tables: ${undocumented.join(', ')}`).toEqual([])
  })

  it('names only tokens the theme declares', () => {
    const undeclared = [...MENTIONED].filter((token) => !DECLARED.has(token)).sort()

    expect(undeclared, `undeclared in layouts/tailwind.css: ${undeclared.join(', ')}`).toEqual([])
  })

  it('gives the hex value the theme declares', () => {
    const wrong = [...STATED]
      .filter(([token, hex]) => DECLARED.get(token) !== hex)
      .map(([token, hex]) => `${token}: doc ${hex}, theme ${DECLARED.get(token) ?? 'undeclared'}`)
      .sort()

    expect(wrong, wrong.join('; ')).toEqual([])
  })
})
