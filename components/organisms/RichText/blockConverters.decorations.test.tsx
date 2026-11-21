import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { blockConverters } from './blockConverters'

type TextboxConverter = (args: {
  childIndex: number
  node: { fields: Record<string, unknown> }
  parent?: { children: unknown[] }
}) => ReactElement | null

const textbox = blockConverters.textbox as unknown as TextboxConverter

const IMG = {
  id: 1,
  url: 'https://imagedelivery.net/acct/img-id/public',
  alt: 'Group class',
  width: 900,
  height: 1200,
}

const block = (fields: Record<string, unknown>) => ({
  type: 'block',
  version: 2,
  fields: { blockType: 'textbox', image: IMG, title: 'Box', ...fields },
})
const paragraph = { type: 'paragraph', version: 1, children: [] }

/** Which ornament a rendered text box draws, read off its markup. */
function ornament(html: string): string {
  if (html.includes('viewBox="0 0 283.6 283.6"')) return 'circle'
  if (html.includes('viewBox="0 0 354.48 314.26"')) return 'triangle'
  if (html.includes('from-teal-100')) return 'gradient'

  return 'none'
}

describe('textbox block converter — decorations', () => {
  it('decorates each box from its place among the page’s text boxes', () => {
    const nodes = [
      block({ imagePosition: 'left' }),
      paragraph,
      block({ imagePosition: 'overlay', textPosition: 'left' }),
      block({ imagePosition: 'right' }),
      block({ imagePosition: 'right', wisdomStyle: true }),
      block({ imagePosition: 'overlay', textPosition: 'right' }),
    ]
    const parent = { type: 'root', children: nodes }
    const drawn = nodes
      .map((node, childIndex) => ({ childIndex, node }))
      .filter(({ node }) => node !== paragraph)
      .map(({ childIndex, node }) =>
        ornament(
          renderToStaticMarkup(
            textbox({ childIndex, node: node as ReturnType<typeof block>, parent }),
          ),
        ),
      )

    expect(drawn).toEqual(['circle', 'triangle', 'gradient', 'none', 'triangle'])
  })

  it('takes a box rendered on its own as the page’s first', () => {
    const html = renderToStaticMarkup(
      textbox({ childIndex: 0, node: block({ imagePosition: 'left' }) }),
    )

    expect(html).toContain('Box')
    expect(ornament(html)).toBe('circle')
  })
})
