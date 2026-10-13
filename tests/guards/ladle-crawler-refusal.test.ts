/**
 * The Ladle build must carry a crawler refusal that reaches every URL.
 *
 * `design.wemeditate.com` was fully indexable (#174), and no test lane can see that: the
 * refusal is a header and a `robots.txt`, which only a deployment serves. This guard exercises
 * the plugin that emits both files, so a renamed file or a moved directory fails here rather
 * than in a deploy nobody rechecks.
 * `tests/smoke/ladle/` asserts the same two facts over HTTP.
 */
import { describe, it, expect } from 'vitest'
import type { Plugin } from 'vite'
import { crawlerRefusal, readRefusalFile, REFUSAL_FILES } from '../../.ladle/crawler-refusal'

/** The headers `_headers` sends for one URL pattern, in any order. */
function headersFor(file: string, pattern: string): string[] {
  const lines = file.split('\n').filter((line) => !line.startsWith('#'))
  const headers: string[] = []

  // Cloudflare Pages reads an indented line as a header of the pattern above it, so collect
  // until the next unindented line rather than assuming a position.
  for (const line of lines.slice(lines.findIndex((l) => l.trim() === pattern) + 1)) {
    if (line.trim() === '') continue
    if (!/^\s/.test(line)) break

    headers.push(line.trim())
  }

  return headers
}

describe('the Ladle crawler refusal', () => {
  it('emits every refusal file at the output root, unhashed', () => {
    const assets: { fileName: string; source: string }[] = []
    const emitFile = (asset: { fileName: string; source: string }) => assets.push(asset)
    const { generateBundle } = crawlerRefusal() as Plugin & { generateBundle: () => void }

    generateBundle.call({ emitFile } as never)

    expect(assets.map((asset) => asset.fileName)).toEqual([...REFUSAL_FILES])

    for (const asset of assets) {
      expect(asset.source, `${asset.fileName} must not be empty`).toBeTruthy()
    }
  })

  it('refuses every crawler in robots.txt, and keeps the preview scrapers allowed', () => {
    const robots = readRefusalFile('robots.txt')

    // Anchoring is what makes a substring an assertion here: it stops a `#` comment satisfying
    // the match, and the blank line stops an `Allow: /` being appended under `*`, which Google
    // reads as the winner. That inversion is one deliberate step from the runbook in `robots.txt`.
    expect(robots).toMatch(/^User-agent: \*\nDisallow: \/\n\n/m)
    // Consecutive `User-agent` lines share a group, so one `Allow: /` closes the whole list.
    expect(robots).toMatch(/^User-agent: Twitterbot\n(?:User-agent: [\w-]+\n)*Allow: \/$/m)
  })

  it('sends noindex on every URL in _headers', () => {
    expect(headersFor(readRefusalFile('_headers'), '/*')).toContain('X-Robots-Tag: noindex')
  })
})
