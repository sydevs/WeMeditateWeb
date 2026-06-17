import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmbedButton, buildEmbedSnippet } from './EmbedButton'

describe('buildEmbedSnippet', () => {
  it('builds an absolute iframe snippet for the English (unprefixed) path', () => {
    const snippet = buildEmbedSnippet('/meditations/123/embed', 'en', 'https://wemeditate.com')

    expect(snippet).toContain('src="https://wemeditate.com/meditations/123/embed"')
    expect(snippet).toContain('<iframe ')
    expect(snippet).toContain('allowfullscreen')
    expect(snippet).toContain('frameborder="0"')
    expect(snippet).toContain('width="560"')
    expect(snippet).toContain('height="315"')
    expect(snippet).toContain('allow="autoplay; fullscreen; encrypted-media; picture-in-picture"')
  })

  it('prefixes the path for non-English locales', () => {
    expect(buildEmbedSnippet('/meditations/123/embed', 'es', 'https://wemeditate.com')).toContain(
      'src="https://wemeditate.com/es/meditations/123/embed"',
    )
    expect(buildEmbedSnippet('/lectures/456/embed', 'de', 'https://wemeditate.com')).toContain(
      'src="https://wemeditate.com/de/lectures/456/embed"',
    )
  })

  it('works for both meditation and lecture embed paths', () => {
    expect(buildEmbedSnippet('/meditations/123/embed', 'en', 'https://x.test')).toContain(
      'src="https://x.test/meditations/123/embed"',
    )
    expect(buildEmbedSnippet('/lectures/456/embed', 'en', 'https://x.test')).toContain(
      'src="https://x.test/lectures/456/embed"',
    )
  })

  it('emits a bare path when origin is empty (SSR / no window)', () => {
    expect(buildEmbedSnippet('/meditations/123/embed', 'en', '')).toContain(
      'src="/meditations/123/embed"',
    )
    expect(buildEmbedSnippet('/meditations/123/embed', 'fr', '')).toContain(
      'src="/fr/meditations/123/embed"',
    )
  })
})

describe('<EmbedButton>', () => {
  it('renders the "Embed" trigger', () => {
    const html = renderToStaticMarkup(
      <EmbedButton
        embedPath="/meditations/123/embed"
        locale="en"
        origin="https://wemeditate.com"
      />,
    )

    expect(html).toContain('Embed')
  })

  it('keeps the snippet collapsed until the popover is opened (closed by default)', () => {
    // The Dropdown renders its children only when open, so the iframe snippet is
    // absent from the initial markup — opening is verified visually in Ladle.
    const html = renderToStaticMarkup(
      <EmbedButton
        embedPath="/meditations/123/embed"
        locale="en"
        origin="https://wemeditate.com"
      />,
    )

    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('Copied!')
  })
})
