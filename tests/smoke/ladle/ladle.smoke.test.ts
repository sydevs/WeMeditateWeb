/**
 * Smoke specs for the Ladle design-system (component library) preview.
 *
 * Ladle's static build is a client-rendered SPA. There is no server or
 * SahajCloud to exercise, so a generic HTML fetch tells us little. But the
 * build emits `/meta.json` (the story manifest), which is a strong,
 * server-free signal that the component library compiled and serves. It
 * lists every story with its name, level path, and source file. No
 * Playwright needed.
 *
 * CI sets PREVIEW_URL to the Ladle preview URL (see the smoke-ladle job).
 */
import { describe, it, expect } from 'vitest'
import { fetchPage } from '../_helpers/preview'

interface LadleMeta {
  about?: { homepage?: string; version?: number }
  stories?: Record<
    string,
    { name?: string; levels?: string[]; filePath?: string; namedExport?: string }
  >
}

describe('ladle preview', () => {
  it('serves the Ladle app shell', async () => {
    const root = await fetchPage('/')

    expect(root.status, 'Ladle root should return 200').toBe(200)
    expect(root.contentType, 'Ladle root should be HTML').toContain('text/html')
    expect(root.html, 'Ladle shell should reference Ladle').toMatch(/Ladle/i)
  })

  it('exposes a non-empty story manifest at /meta.json', async () => {
    const res = await fetchPage('/meta.json')

    expect(res.status, '/meta.json should return 200').toBe(200)

    const meta = JSON.parse(res.html) as LadleMeta

    expect(meta.about?.homepage ?? '', 'meta.about should identify Ladle').toContain('ladle.dev')

    const ids = Object.keys(meta.stories ?? {})

    // The library has 20 or more atom stories, plus molecules and
    // organisms. This guards against an empty or partial build, without
    // being brittle about the exact count.
    expect(
      ids.length,
      `expected a healthy number of stories, got ${ids.length}`,
    ).toBeGreaterThanOrEqual(15)

    // Entries should look like real stories (a name and a .stories source file).
    const sample = meta.stories![ids[0]]

    expect(sample?.name, 'story entries should have a name').toBeTruthy()
    expect(sample?.filePath ?? '', 'story entries should reference a source file').toMatch(
      /\.stories\.tsx?$/,
    )
  })

  /**
   * The playground refuses crawlers through the build output alone (#174), so these two
   * assertions are the only place the refusal is checked against a real deployment. The
   * static files themselves are guarded in `tests/guards/ladle-crawler-refusal.test.ts`.
   */
  it('sends noindex on every URL it serves', async () => {
    // A document and a build asset, because `<meta robots>` could never have covered the
    // second one — and Ladle writes the document itself, so it cannot carry a tag either.
    for (const path of ['/', '/meta.json']) {
      const res = await fetchPage(path)

      expect(res.headers.get('x-robots-tag'), `${path} should send X-Robots-Tag`).toMatch(
        /noindex/i,
      )
    }
  })

  it('serves a real robots.txt, not the SPA shell', async () => {
    const res = await fetchPage('/robots.txt')

    expect(res.status, '/robots.txt should return 200').toBe(200)
    // Ladle's SPA fallback answers an unmatched path with `index.html`, so HTML here means
    // the file is missing from the build output.
    expect(res.contentType, '/robots.txt should not be the Ladle shell').not.toContain('text/html')
    expect(res.html, '/robots.txt should refuse every crawler').toMatch(
      /^User-agent: \*\nDisallow: \/$/m,
    )
  })
})
