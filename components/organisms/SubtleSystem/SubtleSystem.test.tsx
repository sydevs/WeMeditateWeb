/**
 * What the server sends for the chart, and where the drawing's bytes live.
 *
 * The drawing is ~325 KB of markup, which a static import would put in the
 * RichText chunk every page loads. It loads through `React.lazy`, and the
 * server sends every preview and link plus a box the drawing's size.
 */

import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { openTag } from '@/tests/_helpers/markup'
import { readSource, repoRoot, sourceFiles } from '@/tests/guards/_source-scan'

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

  it('takes every closed preview out of the tab order and the a11y tree', () => {
    expect(html.split('inert=""')).toHaveLength(NODE_IDS.length + 1)
  })
})

describe('a focused node', () => {
  // Every rule in source order, as [selector list, declarations]; jsdom computes no CSS.
  const rules = [
    ...readFileSync(join(repoRoot, 'components/organisms/SubtleSystem/SubtleSystem.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].map(([, selectors, body]) => ({ selectors: selectors.trim().split(/\s*,\s*/), body }))
  const declared = (body: string, property: string) =>
    new RegExp(`(?:^|[\\s;])${property}:\\s*([^;]+);`).exec(body)?.[1].trim()
  const isNodeRule = (selector: string) => /^#hover_(channels|chakras) > /.test(selector)

  it('stays drawn with its ring whatever the pointer selected', () => {
    const at = rules.findIndex(({ selectors }) =>
      selectors.some((s) => s.endsWith(':focus-visible')),
    )

    expect(rules[at]?.selectors).toEqual([
      '#hover_channels > :focus-visible',
      '#hover_chakras > :focus-visible',
    ])
    expect(declared(rules[at].body, 'outline')).toBe('2px solid var(--surface-ring)')
    // A node is drawn at opacity 0 unless it is `.active`, and an outline fades with its element.
    expect(declared(rules[at].body, 'opacity')).toBe('1')
    // Same specificity as `.active`, so only source order lets it win there.
    expect(
      rules.findLastIndex(
        ({ selectors, body }) => selectors.some(isNodeRule) && !!declared(body, 'opacity'),
      ),
    ).toBe(at)
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
