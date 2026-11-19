/**
 * What the server sends for the chart, and where the drawing's bytes live.
 *
 * The drawing is ~325 KB of markup. Imported statically it rode the RichText
 * chunk, so every page paid for it; it now loads through `React.lazy`, and the
 * server sends every preview and link plus a box the drawing's size.
 */

import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { openTag } from '../../../tests/_helpers/markup'
import { readSource, repoRoot, sourceFiles } from '../../../tests/guards/_source-scan'

// What the server renders: vike strips `ClientOnly`'s children from that build.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

const { SubtleSystem } = await import('./SubtleSystem')

const NODE_IDS = [
  'channel_left',
  'channel_right',
  'channel_center',
  'chakra_1',
  'chakra_2',
  'chakra_3',
  'chakra_3b',
  'chakra_4',
  'chakra_5',
  'chakra_6',
  'chakra_7',
  'kundalini',
]

const html = renderToStaticMarkup(
  <SubtleSystem
    items={NODE_IDS.map((id) => ({ id, title: id, description: id, linkHref: `/${id}` }))}
  />,
)

const CHART = join(repoRoot, 'assets', 'chart.svg')

const importers = (pattern: RegExp) =>
  sourceFiles(['components/**/*.ts', 'components/**/*.tsx'])
    .filter((file) => pattern.test(readSource(file)))
    .map((file) => relative(repoRoot, file))

describe('<SubtleSystem> on the server', () => {
  it('keeps all twelve preview links', () => {
    for (const id of NODE_IDS) expect(html).toContain(`href="/${id}"`)
  })

  it('leaves the drawing out', () => {
    expect(html).toContain('href="/chakra_1"')
    expect(html).not.toContain('hover_chakras')
  })

  it('holds the drawing’s box with an empty svg on the drawing’s own viewBox', () => {
    const viewBox = /<svg[^>]*\sviewBox="([^"]+)"/.exec(readFileSync(CHART, 'utf8'))?.[1]

    expect(viewBox).toBeTruthy()
    expect(openTag(html, 'svg')).toBe(`<svg aria-hidden="true" viewBox="${viewBox}">`)
  })
})

describe('the drawing’s chunk', () => {
  it('is its own, reached only through a dynamic import', () => {
    expect(importers(/['"][^'"]*chart\.svg(\?raw)?['"]/)).toEqual([
      'components/organisms/SubtleSystem/SubtleSystemChart.tsx',
    ])
    // A static import anywhere would fold the module back into its importer's chunk.
    expect(importers(/\bfrom\s+['"][^'"]*\/SubtleSystemChart['"]/)).toEqual([])
    expect(importers(/\bimport\(\s*['"]\.\/SubtleSystemChart['"]\s*\)/)).toEqual([
      'components/organisms/SubtleSystem/SubtleSystem.tsx',
    ])
  })
})
