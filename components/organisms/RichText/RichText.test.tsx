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

/** A serialized custom-block node (`fields.blockType` + the block's fields). */
const block = (blockType: string, fields: Record<string, unknown>) => ({
  type: 'block',
  fields: { blockType, id: blockType, ...fields },
  format: '',
  version: 2,
})

/** A populated Cloudflare image ref. */
const img = (over: Record<string, unknown> = {}) => ({
  id: 1,
  url: 'https://imagedelivery.net/acct/img/',
  alt: 'Image alt',
  width: 1200,
  height: 800,
  ...over,
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

  it('renders a textbox block via ContentTextBox (title, text, CTA, image)', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('textbox', {
            imagePosition: 'left',
            title: 'Get Connected',
            text: 'Meditate together in person.',
            buttonText: 'Classes near me',
            buttonUrl: '/classes',
            image: img({ alt: 'A class' }),
          }),
        ])}
      />,
    )

    expect(html).toContain('Get Connected')
    expect(html).toContain('Meditate together in person.')
    expect(html).toContain('Classes near me')
    expect(html).toContain('href="/classes"')
    expect(html).toContain('imagedelivery.net/acct/img/')
  })

  it('omits the textbox CTA when there is no button text', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('textbox', { imagePosition: 'left', title: 'No CTA', text: 'Body', image: img() }),
        ])}
      />,
    )

    expect(html).toContain('No CTA')
    expect(html).not.toContain('<a')
  })

  it('renders a quote block via HeroQuote (title, text, credit, caption)', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('quote', {
            title: 'On Kundalini',
            text: 'This Kundalini is the spiritual mother.',
            credit: 'Shri Mataji',
            caption: 'London, 1978',
          }),
        ])}
      />,
    )

    expect(html).toContain('On Kundalini')
    expect(html).toContain('This Kundalini is the spiritual mother.')
    expect(html).toContain('Shri Mataji')
    expect(html).toContain('London, 1978')
  })

  it('renders a button block as a link', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('button', { text: 'Join us', url: 'https://wemeditate.com/live' }),
        ])}
      />,
    )

    expect(html).toContain('Join us')
    expect(html).toContain('href="https://wemeditate.com/live"')
  })

  it('renders an image-gallery block as a grid of images', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('image-gallery', {
            items: [
              img({ id: 1, alt: 'One' }),
              img({ id: 2, alt: 'Two', width: 600, height: 800 }),
            ],
          }),
        ])}
      />,
    )

    expect(html).toContain('alt="One"')
    expect(html).toContain('alt="Two"')
    expect(html).toContain('columns-2')
  })

  it('wraps each image-gallery image in a keyboard-accessible lightbox trigger', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('image-gallery', {
            items: [img({ id: 1, alt: 'One' }), img({ id: 2, alt: 'Two' })],
          }),
        ])}
      />,
    )

    // One trigger per image, each labelled by its alt text; the masonry is intact.
    expect((html.match(/aria-label="View image:/g) ?? []).length).toBe(2)
    expect(html).toContain('aria-label="View image: One"')
    expect(html).toContain('aria-label="View image: Two"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('columns-2')
  })

  it('wraps the standalone upload image in a lightbox trigger inside its figure', () => {
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

    // The SSR figure + caption still render (the lightbox only adds the trigger).
    expect(html).toContain('<figure')
    expect(html).toContain('<figcaption')
    expect(html).toContain('<button')
    expect(html).toContain('aria-label="View image: A sunrise"')
  })

  it('renders a layout block (textList) as a titled list', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('layout', {
            style: 'textList',
            title: 'How to do it',
            items: [
              { id: 's1', title: 'Step 1', text: 'Raise the Kundalini.' },
              { id: 's2', title: 'Step 2', text: 'Tie a knot.' },
            ],
          }),
        ])}
      />,
    )

    expect(html).toContain('How to do it')
    expect(html).toContain('Step 1')
    expect(html).toContain('Raise the Kundalini.')
    expect(html).toContain('Step 2')
  })

  it('renders a layout block (accordion) with item titles and content', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('layout', {
            style: 'accordion',
            items: [{ id: 'q1', title: 'How much does it cost?', text: 'It is free.' }],
          }),
        ])}
      />,
    )

    expect(html).toContain('How much does it cost?')
    expect(html).toContain('It is free.')
  })

  it('renders a table-of-contents block with anchors matching heading ids', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          { type: 'heading', tag: 'h2', children: [text('When to do it?')], version: 1 },
          block('table-of-contents', {
            title: 'Explore below',
            headings: [{ slug: 'stale', text: 'When to do it?', level: 2 }],
          }),
        ])}
      />,
    )

    // The heading converter emits id="when-to-do-it"; the ToC links to it.
    expect(html).toContain('id="when-to-do-it"')
    expect(html).toContain('href="#when-to-do-it"')
    expect(html).toContain('Explore below')
  })

  it('renders a showcase block, resolving relationships and dropping unroutable refs', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('showcase', {
            items: [
              {
                relationTo: 'meditations',
                value: {
                  id: 5,
                  title: 'Morning Med',
                  thumbnail: img({ alt: 't' }),
                  durationMinutes: 10,
                },
              },
              {
                relationTo: 'pages',
                value: { id: 2, slug: 'about', title: 'About Sahaja', meta: { image: img() } },
              },
              // Lectures have no public route yet → dropped.
              { relationTo: 'lectures', value: { id: 3, title: 'A Lecture', thumbnail: img() } },
            ],
          }),
        ])}
      />,
    )

    expect(html).toContain('Morning Med')
    expect(html).toContain('href="/meditations/5"')
    expect(html).toContain('About Sahaja')
    expect(html).toContain('href="/about"')
    expect(html).not.toContain('A Lecture')
  })

  it('renders a subtle-system block, mapping page relationships to SVG node ids', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('subtle-system', {
            left: {
              id: 61,
              slug: 'left-channel',
              title: 'Left Channel',
              meta: { description: 'The left side' },
            },
            mooladhara: { id: 52, slug: 'mooladhara-chakra', title: 'Mooladhara Chakra', meta: {} },
            kundalini: 99, // bare id → dropped
          }),
        ])}
      />,
    )

    expect(html).toContain('data-node-id="channel_left"')
    expect(html).toContain('Left Channel')
    expect(html).toContain('href="/left-channel"')
    expect(html).toContain('data-node-id="chakra_1"')
    expect(html).toContain('Mooladhara Chakra')
  })

  it('renders a splash block over the first image with title, subtitle and CTA', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('splash', {
            layout: 'default',
            images: [img({ alt: 'bg' })],
            title: 'Meditate for better health',
            subtitle: 'Making a start is easier than you think.',
            actionText: 'Try it now',
            actionURL: '/start',
          }),
        ])}
      />,
    )

    expect(html).toContain('Meditate for better health')
    expect(html).toContain('Making a start is easier than you think.')
    expect(html).toContain('Try it now')
    expect(html).toContain('href="/start"')
    expect(html).toContain('imagedelivery.net/acct/img/')
  })

  it('renders a content-index block from server-resolved items', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('content-index', {
            type: 'pages',
            limit: 10,
            resolvedItems: [
              {
                id: 2,
                title: 'About Sahaja',
                href: '/about',
                thumbnailSrc: 'https://imagedelivery.net/a/b/',
                aspectRatio: 'video',
              },
            ],
          }),
        ])}
      />,
    )

    expect(html).toContain('About Sahaja')
    expect(html).toContain('href="/about"')
  })

  it('renders nothing for a content-index block with no resolved items', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          block('content-index', { type: 'lectures', limit: 100, resolvedItems: [] }),
        ])}
      />,
    )

    expect(html).not.toContain('href=')
  })

  it('overlays a debug "?" button on each block only when debug is enabled', () => {
    const content = editorState([
      block('quote', { text: 'Hi' }),
      block('button', { text: 'Go', url: '#' }),
    ])

    const withDebug = renderToStaticMarkup(<RichText debug content={content} />)
    const withoutDebug = renderToStaticMarkup(<RichText content={content} />)

    // One "?" overlay per block when enabled, none by default.
    expect((withDebug.match(/aria-label="Log /g) ?? []).length).toBe(2)
    expect(withoutDebug).not.toContain('aria-label="Log ')
  })

  it('renders a lexical blockquote through the Blockquote atom (distinct from the quote block)', () => {
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([{ type: 'quote', children: [text('A wise saying')], version: 1 }])}
      />,
    )

    expect(html).toContain('<blockquote')
    expect(html).toContain('A wise saying')
    // The Blockquote atom floats and uses a teal gradient backdrop.
    expect(html).toContain('float-right')
  })

  it('flags unknown custom block nodes with a dev alert while still rendering surrounding content', () => {
    // Vitest runs with import.meta.env.DEV === true.
    const html = renderToStaticMarkup(
      <RichText
        content={editorState([
          {
            type: 'block',
            fields: { blockType: 'mystery-block', id: 'x' },
            format: '',
            version: 2,
          },
          { type: 'heading', tag: 'h2', children: [text('After the block')], version: 1 },
        ])}
      />,
    )

    // In development the unknown block surfaces an alert naming the block type,
    expect(html).toContain('role="alert"')
    expect(html).toContain('mystery-block')
    // the library's default "unknown node" span is suppressed,
    expect(html).not.toContain('unknown node')
    // and the rest of the document still renders (no crash).
    expect(html).toContain('After the block')
  })
})
