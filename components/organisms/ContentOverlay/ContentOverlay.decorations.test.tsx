import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentOverlay } from './ContentOverlay'
import { classOf, openTag } from '../../../tests/_helpers/markup'

const BASE = {
  title: 'Making History',
  text: 'Shri Mataji maintained that there is a powerful energy within each human being.',
  imageSrc: 'https://picsum.photos/seed/x/1600/900',
  imageAlt: 'Shri Mataji',
  className: 'full-bleed my-6 clear-both',
} as const

const TRIANGLE = 'viewBox="0 0 354.48 314.26"'

const classes = (html: string, marker: string): string[] => classOf(html, marker).split(' ')

describe('<ContentOverlay> decoration', () => {
  it('leaves an undecorated block exactly as its caller styled it', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} />)

    expect(classOf(html, '<div')).toBe(BASE.className)
    expect(html).not.toContain('<svg')
  })

  it('hangs the triangle off the lower corner away from the text', () => {
    const textLeft = renderToStaticMarkup(<ContentOverlay {...BASE} decoration="triangle" />)
    const textRight = renderToStaticMarkup(
      <ContentOverlay {...BASE} align="right" decoration="triangle" />,
    )
    const textCentre = renderToStaticMarkup(
      <ContentOverlay {...BASE} align="center" decoration="triangle" />,
    )

    expect(classes(textLeft, TRIANGLE)).toEqual(
      expect.arrayContaining(['absolute', 'bottom-0', 'translate-y-1/3', 'right-6']),
    )
    expect(classes(textRight, TRIANGLE)).toContain('left-6')
    expect(classes(textCentre, TRIANGLE)).toContain('left-6')
  })

  it('grows the block’s bottom margin to hold the part that hangs below', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} decoration="triangle" />)

    expect(classes(html, '<div')).toEqual(
      expect.arrayContaining(['relative', 'lg:mb-32', 'full-bleed', 'my-6']),
    )
  })

  it('keeps the triangle out of the a11y tree and off narrow screens', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} decoration="triangle" />)

    expect(classes(html, TRIANGLE)).toEqual(
      expect.arrayContaining(['hidden', 'lg:block', 'pointer-events-none']),
    )
    expect(openTag(html, 'svg')).toContain('aria-hidden="true"')
  })
})
