/**
 * The actions come from `wm-web-config.classPages`, never from a hard-coded
 * path: nothing upstream would correct a literal when an editor renames or
 * swaps a page, and three of them already 404ed that way.
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { NavPage } from '@/types/sahajcloud'
import { anchorFor, classOf, classesWith, openTag } from '@/tests/_helpers/markup'
import { DiscoverMeditation } from './DiscoverMeditation'

const page = (id: number, slug: string, title: string, meta?: NavPage['meta']): NavPage => ({
  id,
  slug,
  title,
  ...(meta ? { meta } : {}),
})

/** The live order on 2026-11-19, which is not the order the old literals had. */
const CLASS_PAGES = [
  page(11, 'classes-near-me', 'Classes Near Me'),
  page(14, 'live-meditations', 'Live Meditations'),
  page(10, 'meditate-now', 'Meditate Now'),
]

const render = (pages: readonly NavPage[]) =>
  renderToStaticMarkup(<DiscoverMeditation pages={pages} />)

describe('DiscoverMeditation actions', () => {
  it('links each configured page, in the order the editor set', () => {
    const html = render(CLASS_PAGES)
    const at = CLASS_PAGES.map(({ slug }) => html.indexOf(`href="/${slug}"`))

    expect(at.every((index) => index > -1)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })

  it('names each action by its page title', () => {
    const html = render(CLASS_PAGES)

    for (const { title } of CLASS_PAGES) {
      expect(html).toContain(`>${title}</span>`)
    }
  })

  it('offers at most five, the most SahajCloud lets an editor pick', () => {
    const six = Array.from({ length: 6 }, (_, i) => page(i + 1, `page-${i + 1}`, `Page ${i + 1}`))
    const html = render(six)

    expect(anchorFor(html, '/page-5')).not.toBe('')
    expect(anchorFor(html, '/page-6')).toBe('')
  })

  it('skips a page that resolves to no link, and renders nothing when none does', () => {
    const unlinked = page(3, '', 'Untitled')

    expect(render([unlinked, ...CLASS_PAGES.slice(0, 1)])).not.toContain('Untitled')
    expect(render([unlinked])).toBe('')
    expect(render([])).toBe('')
  })

  it("draws a page's description under its title, and no line where it has none", () => {
    const described = page(14, 'live-meditations', 'Live Meditations', {
      description: 'Meditate online with a live guide',
    })

    const withLine = render([described])

    expect(withLine).toContain('Meditate online with a live guide')
    expect(classesWith(withLine, 'line-clamp-2')).toHaveLength(1)
    expect(
      classesWith(render([page(14, 'live-meditations', 'Live Meditations')]), 'line-clamp-2'),
    ).toHaveLength(0)
  })

  it('pictures every action with the same leaf, a page with a meta image included', () => {
    const pictured = page(12, 'wemeditate-app', 'WeMeditate App', {
      image: {
        id: 1,
        url: 'https://imagedelivery.net/acct/fixture/public',
        alt: 'A meditator at dawn',
      } as NonNullable<NavPage['meta']>['image'],
    })

    const html = render([...CLASS_PAGES, pictured])

    expect(classesWith(html, 'w-16')).toHaveLength(4)
    expect(openTag(html, 'svg')).toContain('aria-hidden="true"')
    expect(openTag(html, 'img')).toBe('')
    expect(html).not.toContain('imagedelivery.net')
  })

  // jsdom computes no colour, and the text-contrast guard reads a gray step
  // against white, not against this photo — where gray-700 measured 3.8:1.
  it('draws its heading and subtitle in gray-900, the step that clears 4.5:1 on the photo', () => {
    const html = render(CLASS_PAGES)

    expect(classOf(html, '<section').split(/\s+/)).toContain('text-gray-900')

    for (const tag of ['<h2', '<p']) {
      const classes = classOf(html, tag)

      expect(classes).not.toBe('')
      expect(classes).not.toMatch(/\btext-gray-\d+/)
    }
  })
})
