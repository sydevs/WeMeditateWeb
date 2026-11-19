// @vitest-environment jsdom
/**
 * The mega-menu's featured articles across re-renders. Vike keeps the layout
 * mounted through a client-side navigation and hands it fresh `settings`, so
 * a locale switch reaches this hook as new lists, not as a new mount.
 */

import { afterEach, describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { WebConfig } from '../server/sahajcloud-types'
import { useSiteNav } from './useSiteNav'

// A real request's context, so the hook can read it directly rather than
// through the optional accessor a bare component render needs.
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'en', urlPathname: '/' }),
}))

const page = (id: number, title: string) => ({ id, slug: `page-${id}`, title })

/** A config whose pages carry `titles`, under ids that stay put across locales. */
const settings = (titles: string[]) =>
  ({
    featuredPages: [],
    classPages: [],
    knowledgePages: [page(100, titles[0])],
    featuredArticles: titles.map((title, index) => page(index + 1, title)),
  }) as unknown as WebConfig

const featuredTitles = (nav: ReturnType<typeof useSiteNav>) =>
  nav.navItems
    .find((item) => item.dropdown)
    ?.dropdown?.featuredArticles?.map((article) => article.title)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSiteNav · featured articles', () => {
  it('follows a locale switch instead of keeping the first language’s titles', () => {
    const { result, rerender } = renderHook(({ config }) => useSiteNav(config), {
      initialProps: { config: settings(['History', 'Breathing']) },
    })

    expect(featuredTitles(result.current)).toEqual(['History', 'Breathing'])

    rerender({ config: settings(['Histoire', 'Respiration']) })

    expect(featuredTitles(result.current)).toEqual(['Histoire', 'Respiration'])
  })

  it('keeps its random picks while fresh settings hold the same pages', () => {
    const rolls = [0, 0, 0.99, 0.99]

    vi.spyOn(Math, 'random').mockImplementation(() => rolls.shift() ?? 0.5)

    const titles = ['One', 'Two', 'Three', 'Four']
    const { result, rerender } = renderHook(({ config }) => useSiteNav(config), {
      initialProps: { config: settings(titles) },
    })
    const first = featuredTitles(result.current)

    expect(first).toHaveLength(2)

    // A same-locale navigation: equal lists, new objects.
    rerender({ config: settings(titles) })

    expect(featuredTitles(result.current)).toEqual(first)
  })
})
