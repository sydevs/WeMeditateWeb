import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RichText } from './RichText'

/** Wrap top-level nodes in a serialized Lexical editor state. */
function editorState(children: unknown[]) {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

const text = (value: string, format = 0) => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const paragraph = (children: unknown[]) => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

describe('<RichText>', () => {
  it('renders nothing for empty/missing content', () => {
    expect(renderToStaticMarkup(<RichText content={null} />)).toBe('')
    expect(renderToStaticMarkup(<RichText content={undefined} />)).toBe('')
    expect(renderToStaticMarkup(<RichText content={{}} />)).toBe('')
  })

  it('renders paragraphs with formatted (bold) text via the default converters', () => {
    const html = renderToStaticMarkup(
      <RichText content={editorState([paragraph([text('Hello '), text('world', 1)])])} />,
    )

    expect(html).toContain('<p')
    expect(html).toContain('Hello ')
    expect(html).toContain('<strong')
    expect(html).toContain('world')
  })

  it('gives headings a slugified anchor id and uses the node tag', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          { type: 'heading', tag: 'h2', children: [text('Hello World!')], version: 1 },
          { type: 'heading', tag: 'h3', children: [text('Café Société')], version: 1 },
        ])}
      />,
    )

    expect(html).toContain('<h2 id="hello-world"')
    // Latin diacritics are folded when building the anchor id.
    expect(html).toContain('<h3 id="cafe-societe"')
  })

  it('downgrades an h1 heading to h2 to avoid colliding with the page title', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          { type: 'heading', tag: 'h1', children: [text('Title')], version: 1 },
        ])}
      />,
    )

    expect(html).toContain('<h2')
    expect(html).not.toContain('<h1')
  })

  it('renders an internal page link through the route mapper', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          paragraph([
            {
              type: 'link',
              fields: {
                linkType: 'internal',
                newTab: false,
                doc: { relationTo: 'pages', value: { id: 1, slug: 'about' } },
              },
              children: [text('About us')],
              version: 1,
            },
          ]),
        ])}
      />,
    )

    expect(html).toContain('href="/about"')
    expect(html).toContain('About us')
  })

  it('renders a custom external link with new-tab attributes', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          paragraph([
            {
              type: 'link',
              fields: { linkType: 'custom', url: 'https://example.com', newTab: true },
              children: [text('External')],
              version: 1,
            },
          ]),
        ])}
      />,
    )

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('degrades an internal link to an unroutable collection to plain text (no dead link)', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          paragraph([
            {
              type: 'link',
              fields: {
                linkType: 'internal',
                newTab: false,
                doc: { relationTo: 'forms', value: { id: 9 } },
              },
              children: [text('Contact form')],
              version: 1,
            },
          ]),
        ])}
      />,
    )

    expect(html).toContain('Contact form')
    expect(html).not.toContain('<a')
  })

  it('renders an inline relationship as a link to the mapped route', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          {
            type: 'relationship',
            relationTo: 'pages',
            value: { id: 2, slug: 'guide', title: 'The Guide' },
            version: 1,
          },
        ])}
      />,
    )

    expect(html).toContain('href="/guide"')
    expect(html).toContain('The Guide')
  })

  it('degrades an inline relationship to an unroutable collection to plain text', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          {
            type: 'relationship',
            relationTo: 'lectures',
            value: { id: 3, title: 'A Lecture' },
            version: 1,
          },
        ])}
      />,
    )

    expect(html).toContain('A Lecture')
    expect(html).not.toContain('<a')
  })

  it('renders an upload image in a <figure> with a Cloudflare variant, caption and alignment', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          {
            type: 'upload',
            relationTo: 'images',
            value: {
              id: 4,
              url: 'https://imagedelivery.net/acct/img123/',
              alt: 'A sunrise',
              width: 1600,
              height: 900,
            },
            fields: { align: 'center', caption: 'Sunrise over the hills' },
            version: 1,
          },
        ])}
      />,
    )

    expect(html).toContain('<figure')
    expect(html).toContain('mx-auto')
    // 1600×900 ≈ 16:9 → snaps to the `video` variant family.
    expect(html).toContain('imagedelivery.net/acct/img123/video-')
    expect(html).toContain('alt="A sunrise"')
    expect(html).toContain('<figcaption')
    expect(html).toContain('Sunrise over the hills')
  })

  it('skips an upload whose value is an unpopulated bare id', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          { type: 'upload', relationTo: 'images', value: 4, fields: {}, version: 1 },
        ])}
      />,
    )

    expect(html).not.toContain('<figure')
    expect(html).not.toContain('<img')
  })

  it('falls back gracefully for unknown custom block nodes (renders nothing, no crash)', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          { type: 'block', fields: { blockType: 'showcase', id: 'x' }, format: '', version: 2 },
          { type: 'heading', tag: 'h2', children: [text('After the block')], version: 1 },
        ])}
      />,
    )

    // The unknown block is dropped, but the rest of the document still renders.
    expect(html).not.toContain('unknown node')
    expect(html).toContain('After the block')
  })
})
