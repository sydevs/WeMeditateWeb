import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmbedButton, buildEmbedSnippet } from './EmbedButton'

describe('buildEmbedSnippet', () => {
  it('builds an absolute iframe snippet for the English (unprefixed) path', () => {
    const snippet = buildEmbedSnippet('/m/123', 'en', 'https://wemeditate.com')

    expect(snippet).toContain('src="https://wemeditate.com/m/123"')
    expect(snippet).toContain('<iframe ')
    expect(snippet).toContain('allowfullscreen')
    expect(snippet).toContain('frameborder="0"')
    expect(snippet).toContain('width="560"')
    expect(snippet).toContain('height="315"')
    expect(snippet).toContain('allow="autoplay; fullscreen; encrypted-media; picture-in-picture"')
  })

  it('prefixes the path for non-English locales', () => {
    expect(buildEmbedSnippet('/m/123', 'es', 'https://wemeditate.com')).toContain(
      'src="https://wemeditate.com/es/m/123"',
    )
    expect(buildEmbedSnippet('/l/456', 'de', 'https://wemeditate.com')).toContain(
      'src="https://wemeditate.com/de/l/456"',
    )
  })

  it('works for both meditation and lecture embed paths', () => {
    expect(buildEmbedSnippet('/m/123', 'en', 'https://x.test')).toContain(
      'src="https://x.test/m/123"',
    )
    expect(buildEmbedSnippet('/l/456', 'en', 'https://x.test')).toContain(
      'src="https://x.test/l/456"',
    )
  })

  it('emits a bare path when origin is empty (SSR / no window)', () => {
    expect(buildEmbedSnippet('/m/123', 'en', '')).toContain('src="/m/123"')
    expect(buildEmbedSnippet('/m/123', 'fr', '')).toContain('src="/fr/m/123"')
  })
})

describe('<EmbedButton>', () => {
  it('renders the "Embed" trigger', () => {
    const html = renderToStaticMarkup(
      <EmbedButton embedPath="/m/123" locale="en" origin="https://wemeditate.com" />,
    )

    expect(html).toContain('Embed')
  })

  it('keeps the snippet collapsed until the popover is opened (closed by default)', () => {
    // The Dropdown renders its children only when open, so the iframe snippet is
    // absent from the initial markup — opening is verified visually in Ladle.
    const html = renderToStaticMarkup(
      <EmbedButton embedPath="/m/123" locale="en" origin="https://wemeditate.com" />,
    )

    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('Copied!')
  })
})
