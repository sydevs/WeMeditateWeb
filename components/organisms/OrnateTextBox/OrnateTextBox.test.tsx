import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { OrnateTextBox } from './OrnateTextBox'
import { classFor, classOf } from '../../../tests/_helpers/markup'

const BASE = {
  title: 'Sacred Teachings',
  description: 'In every culture one can find tales of timeless wisdom.',
  imageSrc: 'https://picsum.photos/seed/x/900/1200',
  imageAlt: 'Artwork',
} as const

const ornateImg = (html: string) => html.match(/<img[^>]*ornate[^>]*>/)?.[0] ?? ''

describe('<OrnateTextBox>', () => {
  it('renders the warm ornate ground and the floral graphic', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    // Warm-brown gradient ground (distinctive to the ornate treatment).
    expect(html).toContain('#6b5340')
    // The decorative ornate.svg graphic is rendered as a background image.
    expect(html).toContain('ornate')
  })

  it('renders title and description', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('Sacred Teachings')
    expect(html).toContain('timeless wisdom')
  })

  it('splits the description into paragraphs on newlines', () => {
    const html = renderToStaticMarkup(
      <OrnateTextBox {...BASE} description={'First paragraph.\n\nSecond paragraph.'} />,
    )

    expect(html).toContain('<p>First paragraph.</p>')
    expect(html).toContain('<p>Second paragraph.</p>')
  })

  it('renders the subtitle when provided', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} subtitle="Timeless teachings" />)

    expect(html).toContain('Timeless teachings')
  })

  it('honours a custom sidetext label', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} sidetext="Ancient Knowledge" />)

    expect(html).toContain('Ancient Knowledge')
    expect(html).toContain('[writing-mode:vertical-rl]')
  })

  it('draws no sidetext when the caller passes none', () => {
    // No translation stands in for an absent label: the key this used to
    // read holds no English upstream, so the decoration is the caller's.
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).not.toContain('[writing-mode:vertical-rl]')
  })

  it('renders no sidetext at all for an empty label', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} sidetext="" />)

    expect(html).not.toContain('[writing-mode:vertical-rl]')
  })

  // The image takes a grid column of its own, and the header and body share
  // the one beside it. Placement is explicit because grid auto-placement
  // follows source order, which here is title, subtitle, image, body.
  it.each([
    ['left', 'lg:grid-cols-[44%_1fr]', 'lg:col-start-1', 'lg:col-start-2'],
    ['right', 'lg:grid-cols-[1fr_44%]', 'lg:col-start-2', 'lg:col-start-1'],
  ] as const)(
    'gives the %s layout an image column and a text column',
    (align, columns, imageColumn, textColumn) => {
      const html = renderToStaticMarkup(
        <OrnateTextBox {...BASE} align={align} subtitle="Timeless teachings" />,
      )

      // `lg:row-span-2` is the image wrapper's alone, and `lg:mb-6` the
      // header's: neither column class names an element on its own, since
      // the two columns swap with `align`.
      expect(classFor(html, 'lg:pr-24').split(' ')).toContain(columns)
      expect(classFor(html, 'lg:row-span-2').split(' ')).toContain(imageColumn)
      expect(classFor(html, 'lg:mb-6').split(' ')).toContain(textColumn)
      expect(classFor(html, 'space-y-5').split(' ')).toContain(textColumn)
    },
  )

  it('defaults to the left layout, so an omitted align renders as align="left"', () => {
    expect(renderToStaticMarkup(<OrnateTextBox {...BASE} />)).toEqual(
      renderToStaticMarkup(<OrnateTextBox {...BASE} align="left" />),
    )
  })

  // The band lightens the image's edge. On the wrong side it sits under the
  // body column and drops it to 2.50:1, below WCAG AA (#193, #205). The angle is
  // pinned with the side: both must compile, and 270deg is what keeps the
  // peach stop on the band's inner edge from `right-0`.
  it('keeps the warm gradient on the image side, angled inward', () => {
    // `-top-24` is the warm band's alone; the brown ground is a gradient too.
    const left = classFor(renderToStaticMarkup(<OrnateTextBox {...BASE} align="left" />), '-top-24')

    expect(left).toContain('left-0')
    expect(left).toContain('linear-gradient(90deg')

    const right = classFor(
      renderToStaticMarkup(<OrnateTextBox {...BASE} align="right" />),
      '-top-24',
    )

    expect(right).toContain('right-0')
    expect(right).toContain('linear-gradient(270deg')
  })

  // Below `lg` the body column is full-width and crosses the band, where the
  // full-strength peach drops it to 2.57:1. The faint pair is what holds AA
  // there, so each align carries both intensities, not one (#193, #205).
  it.each([
    ['left', '90deg'],
    ['right', '270deg'],
  ] as const)('runs the %s band faint below lg and full from lg up', (align, angle) => {
    const band = classFor(
      renderToStaticMarkup(<OrnateTextBox {...BASE} align={align} />),
      '-top-24',
    )

    expect(band).toContain(`bg-[linear-gradient(${angle},rgba(255,255,255,0.01)`)
    expect(band).toContain(`lg:bg-[linear-gradient(${angle},rgba(255,255,255,0.02)`)
    expect(band).toContain('rgba(255,196,175,0.08)_100%)]')
    expect(band).toContain('rgba(255,196,175,0.6)_100%)]')
  })

  // These AA floors are a composite of the brown ground, the graphic and the
  // band, so `layouts/tailwind.test.ts` cannot reach them — the class values
  // are all there is to pin. The worst body cell measures 5.19:1 (#205), and
  // `text-white/80` left the subtitle at 3.94:1 against a 4.5:1 bar even in
  // the layout the band is clear of (#262). Any alpha is what takes either
  // back under its bar; the root already paints white, so the token the body
  // wrapper carries is not the subject.
  it('keeps the graphic faint and the subtitle and body copy free of alpha', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} subtitle="Timeless teachings" />)
    const body = classFor(html, 'space-y-5')
    const subtitle = classOf(html, 'Timeless teachings')

    expect(ornateImg(html)).toContain('opacity-25')
    expect(body).toContain('leading-relaxed')
    expect(body).not.toContain('text-white/')
    expect(subtitle).toContain('font-light')
    expect(subtitle).not.toContain('text-white/')
  })

  // A screen reader reads source order, which no `order-*` reorder changes
  // (Flexbox §5.4, WCAG SC 1.3.2). A float would have had to precede the
  // header to put it in the text column — across the band instead the title
  // measures 2.47:1 against a 3:1 bar (#262) — so the grid is what lets one
  // order serve both the eye and the reader, at every width.
  it('renders title, subtitle, image then body in source order, with no reorder', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} subtitle="Timeless teachings" />)

    // A missing marker indexes as -1, which satisfies `toBeLessThan` against
    // anything, so each one is pinned as present before it is ordered.
    expect(html).toContain('Sacred Teachings')
    expect(html).toContain('Timeless teachings')
    expect(html).toContain('picsum')
    expect(html).toContain('timeless wisdom')
    expect(html.indexOf('Sacred Teachings')).toBeLessThan(html.indexOf('Timeless teachings'))
    expect(html.indexOf('Timeless teachings')).toBeLessThan(html.indexOf('picsum'))
    expect(html.indexOf('picsum')).toBeLessThan(html.indexOf('timeless wisdom'))

    // `not.toContain('order-')` would pass on `border-white`, so each of the
    // three children is asked for its own order class instead.
    for (const marker of ['lg:row-span-2', 'lg:mb-6', 'space-y-5']) {
      const classes = classFor(html, marker).split(' ')

      expect(classes).toContain(marker)
      expect(classes.filter((name) => /(^|:)order-/.test(name))).toEqual([])
      expect(classes.filter((name) => /(^|:)float-/.test(name))).toEqual([])
    }
  })

  it('renders the CTA only when both text and href are set', () => {
    const without = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(without).not.toContain('<a')

    const withCta = renderToStaticMarkup(
      <OrnateTextBox {...BASE} ctaHref="#" ctaText="Read more" />,
    )

    expect(withCta).toContain('Read more')
  })
})

describe('<OrnateTextBox> image loading', () => {
  it('keeps the decorative floral graphic lazy, so no preload link is hoisted', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).not.toContain('rel="preload"')
    expect(ornateImg(html)).toContain('loading="lazy"')
  })
})
