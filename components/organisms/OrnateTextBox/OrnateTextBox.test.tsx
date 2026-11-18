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

  it('defaults the decorative sidetext to "Ancient Wisdom"', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('Ancient Wisdom')
  })

  it('honours a custom sidetext label', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} sidetext="Ancient Knowledge" />)

    expect(html).toContain('Ancient Knowledge')
    expect(html).not.toContain('Ancient Wisdom')
  })

  it('floats the image left so the body text wraps around it', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('lg:float-left')
    expect(html).toContain('lg:mr-12')
    expect(html).not.toContain('lg:float-right')
  })

  it('floats the image right under align="right"', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} align="right" />)

    expect(html).toContain('lg:float-right')
    expect(html).toContain('lg:ml-12')
    expect(html).not.toContain('lg:float-left')
  })

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

  // A float only affects what follows it, so the header can only share the
  // body's column by coming after the image in source order. Across the band
  // instead, the title measures 2.47:1 against a 3:1 bar (#262). The
  // block-formatting context is then what keeps the header out of the float's
  // margin box, whichever way the float points (#193).
  it("puts the floated image before the header, in the header's own BFC", () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} subtitle="Sub" />)

    // A missing marker indexes as -1, which satisfies `toBeLessThan` against
    // anything, so each one is pinned as present before it is ordered.
    expect(html).toContain('lg:float-left')
    expect(html.indexOf('lg:float-left')).toBeLessThan(html.indexOf('Sacred Teachings'))
    expect(html.indexOf('Sacred Teachings')).toBeLessThan(html.indexOf('timeless wisdom'))
    expect(classFor(html, 'lg:mb-6').split(' ')).toContain('lg:flow-root')
  })

  // Source order is image, header, body; the reading order below `lg` is
  // title, subtitle, image, body. `order-*` reconciles the two, and needs a
  // flex container to act in. At `lg` the container is `flow-root` instead,
  // which both makes `order-*` inert and contains the float's height.
  it('restores the reading order below lg, and drops to flow-root at lg', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} subtitle="Sub" />)
    const container = classFor(html, 'lg:pr-24')

    expect(container.split(' ')).toContain('flex-col')
    expect(container.split(' ')).toContain('lg:flow-root')
    expect(classFor(html, 'lg:float-left').split(' ')).toContain('order-2')
    expect(classFor(html, 'lg:mb-6').split(' ')).toContain('order-1')
    expect(classFor(html, 'space-y-5').split(' ')).toContain('order-3')
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
