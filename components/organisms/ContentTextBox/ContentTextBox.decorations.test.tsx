import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentTextBox } from './ContentTextBox'
import { classFor, classOf, openTag } from '../../../tests/_helpers/markup'

const BASE = {
  title: 'Get Connected',
  description: 'Meditation is even stronger when shared.',
  imageSrc: 'https://picsum.photos/seed/x/900/1200',
  imageAlt: 'Group class',
} as const

const TRIANGLE = 'viewBox="0 0 354.48 314.26"'
const CIRCLE = 'viewBox="0 0 283.6 283.6"'

const classes = (html: string, marker: string): string[] => classOf(html, marker).split(' ')

describe('<ContentTextBox> decoration', () => {
  it('draws no ornament unless asked', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} />)

    expect(html).toContain('Get Connected')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('from-teal-100')
  })

  it('hangs the triangle off the image’s outer lower corner', () => {
    const left = renderToStaticMarkup(<ContentTextBox {...BASE} decoration="triangle" />)
    const right = renderToStaticMarkup(
      <ContentTextBox {...BASE} align="right" decoration="triangle" />,
    )

    expect(classes(left, TRIANGLE)).toEqual(
      expect.arrayContaining(['absolute', 'bottom-0', 'translate-y-1/3', 'left-6']),
    )
    expect(classes(right, TRIANGLE)).toContain('right-6')
    expect(classes(right, TRIANGLE)).not.toContain('left-6')
  })

  it('draws the circle behind the image’s inner lower corner', () => {
    const left = renderToStaticMarkup(<ContentTextBox {...BASE} decoration="circle" />)
    const right = renderToStaticMarkup(
      <ContentTextBox {...BASE} align="right" decoration="circle" />,
    )

    expect(classes(left, CIRCLE)).toEqual(
      expect.arrayContaining(['-z-10', '-right-24', 'text-line-subtle']),
    )
    expect(classes(right, CIRCLE)).toContain('-left-24')
  })

  it('runs the wash under the image’s outer side, fading outwards', () => {
    const left = renderToStaticMarkup(<ContentTextBox {...BASE} decoration="gradient" />)
    const right = renderToStaticMarkup(
      <ContentTextBox {...BASE} align="right" decoration="gradient" />,
    )

    expect(classFor(left, 'from-teal-100').split(' ')).toEqual(
      expect.arrayContaining(['-z-10', 'left-0', 'right-[40%]', 'bg-linear-to-l']),
    )
    expect(classFor(right, 'from-teal-100').split(' ')).toEqual(
      expect.arrayContaining(['right-0', 'left-[40%]', 'bg-linear-to-r']),
    )
  })

  it('keeps every ornament out of the a11y tree and off narrow screens', () => {
    const tags = [
      openTag(renderToStaticMarkup(<ContentTextBox {...BASE} decoration="circle" />), 'svg'),
      openTag(renderToStaticMarkup(<ContentTextBox {...BASE} decoration="triangle" />), 'svg'),
      openTag(
        renderToStaticMarkup(<ContentTextBox {...BASE} decoration="gradient" />),
        'div aria-hidden="true"',
      ),
    ]

    for (const tag of tags) {
      expect(tag).toContain('aria-hidden="true"')
      expect(classOf(tag, '<').split(' ')).toEqual(
        expect.arrayContaining(['hidden', 'lg:block', 'pointer-events-none']),
      )
    }
    expect(tags[2]).toContain('from-teal-100')
  })

  // The image overflows a root capped at 700px, so an ornament hung from the
  // image's own bottom would reach past the root's margin into the next block.
  it('anchors the ornaments to a wrapper that spans the root’s height', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} decoration="triangle" />)

    expect(classFor(html, 'lg:self-stretch').split(' ')).toEqual(
      expect.arrayContaining(['relative', 'isolate', 'lg:grid', 'lg:items-center']),
    )
  })
})
