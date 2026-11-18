// @vitest-environment jsdom
/**
 * The blocking accessibility gate: axe over each page type a visitor browses,
 * plus the two embedded players handed to other sites.
 *
 * Any violation fails. Nothing is reported as a warning — a check that can
 * pass with findings stops nothing from shipping (sydevs/WeMeditateWeb#162,
 * decision of 2026-10-09).
 *
 * **It renders the real chrome.** Only vike's own plumbing is stubbed: the
 * route data, `useConfig`, and `ClientOnly`, which drops its children on the
 * server. The header, the mega dropdown, the footer link lists and the
 * language control all render for real, because that chrome is where the
 * landmark and nested-interactive defects lived.
 *
 * **Two rules are off by name, not by accident.** jsdom computes no layout, so
 * `color-contrast` and `target-size` can only answer "unknown" here. The
 * decision of 2026-10-21 moved both to the keyboard walk-through
 * (`docs/accessibility-walkthrough.md`), which measures them on a drawn page.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import axe, { type Result, type RunOptions } from 'axe-core'
import { EN_TRANSLATIONS } from '../../lib/i18n'
import { articlePage, atlasSeo, homePage, lecture, meditation, webConfig } from './fixtures'

/** Route data, swapped per target before the render. */
const routeData: { current: unknown } = { current: {} }

vi.mock('vike-react/useData', () => ({ useData: () => routeData.current }))
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({
    locale: 'en',
    urlPathname: '/index',
    urlParsed: { origin: 'https://wemeditate.com' },
    translations: EN_TRANSLATIONS,
  }),
}))
vi.mock('vike-react/useConfig', () => ({ useConfig: () => () => {} }))
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

const { default: LayoutChrome } = await import('../../layouts/LayoutChrome')
const { default: LayoutMap } = await import('../../layouts/LayoutMap')
const { Page: HomeOrArticlePage } = await import('../../pages/[slug]/+Page')
const { Page: MeditationPage } = await import('../../pages/meditations/[id]/(full)/+Page')
const { Page: LecturePage } = await import('../../pages/lectures/[id]/(full)/+Page')
const { Page: MapPage } = await import('../../pages/map/+Page')
const { Page: MeditationEmbedPage } = await import('../../pages/meditations/[id]/embed/+Page')
const { Page: LectureEmbedPage } = await import('../../pages/lectures/[id]/embed/+Page')

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

/** Needs a drawn box, which jsdom has none of. See the module comment. */
const NEEDS_LAYOUT = ['color-contrast', 'target-size']

/**
 * The four rules an embed cannot satisfy, because it has no chrome: it is a
 * fragment of someone else's page and owns neither the `<main>` nor the
 * outline root. Nothing else is relaxed for them.
 */
const CHROME_ONLY = ['page-has-heading-one', 'region', 'bypass', 'landmark-one-main']

function options(exclude: string[]): RunOptions {
  return {
    runOnly: { type: 'tag', values: TAGS },
    rules: Object.fromEntries(exclude.map((id) => [id, { enabled: false }])),
  }
}

/** Every target, as the gate's own output names them. */
const TARGETS = [
  {
    name: 'home',
    chrome: true,
    render: () => {
      routeData.current = { settings: webConfig, page: homePage }

      return (
        <LayoutChrome>
          <HomeOrArticlePage />
        </LayoutChrome>
      )
    },
  },
  {
    name: 'article',
    chrome: true,
    render: () => {
      routeData.current = { settings: webConfig, page: articlePage }

      return (
        <LayoutChrome>
          <HomeOrArticlePage />
        </LayoutChrome>
      )
    },
  },
  {
    name: 'meditation',
    chrome: true,
    render: () => {
      routeData.current = { settings: webConfig, meditation, musicTracks: [] }

      return (
        <LayoutChrome>
          <MeditationPage />
        </LayoutChrome>
      )
    },
  },
  {
    name: 'lecture',
    chrome: true,
    render: () => {
      routeData.current = { settings: webConfig, lecture, locale: 'en' }

      return (
        <LayoutChrome>
          <LecturePage />
        </LayoutChrome>
      )
    },
  },
  {
    name: 'map',
    chrome: true,
    render: () => {
      routeData.current = { settings: webConfig, seo: atlasSeo, atlasRoute: null }

      return (
        <LayoutMap>
          <MapPage />
        </LayoutMap>
      )
    },
  },
  {
    name: 'meditation embed',
    chrome: false,
    render: () => {
      routeData.current = { meditation, musicTracks: [] }

      return <MeditationEmbedPage />
    },
  },
  {
    name: 'lecture embed',
    chrome: false,
    render: () => {
      routeData.current = { lecture, locale: 'en' }

      return <LectureEmbedPage />
    },
  },
]

/**
 * The document shell vike serves, which no component here renders: the `lang`
 * from `pages/+onBeforeRender.ts` and a `<title>`. Without them every target
 * would report `html-has-lang` and `document-title` against markup that is
 * not theirs.
 */
function mountDocument(markup: string): void {
  document.documentElement.lang = 'en'
  document.title = 'We Meditate'
  document.body.innerHTML = markup
}

/** Violations, as `<rule-id> (<impact>): <node count>`, so a failure reads. */
function describeViolations(violations: Result[]): string[] {
  return violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.nodes.length} node(s) — ` +
      violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | '),
  )
}

async function violationsFor(target: (typeof TARGETS)[number]): Promise<string[]> {
  mountDocument(renderToStaticMarkup(target.render()))

  const result = await axe.run(
    document.body,
    options(target.chrome ? NEEDS_LAYOUT : [...NEEDS_LAYOUT, ...CHROME_ONLY]),
  )

  return describeViolations(result.violations)
}

describe('accessibility · page types', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('runs the rule set the goal asks for, with only the two layout rules off', () => {
    // Without this, dropping `best-practice` would silently stop the gate
    // seeing `heading-order`, `landmark-unique` and `page-has-heading-one` —
    // three of the goal's own lines.
    expect(TAGS).toContain('best-practice')
    expect(Object.keys(options(NEEDS_LAYOUT).rules ?? {})).toEqual(NEEDS_LAYOUT)
  })

  it.each(TARGETS.map((target) => [target.name, target] as const))(
    '%s has no axe violations',
    async (_name, target) => {
      expect(await violationsFor(target)).toEqual([])
    },
    30_000,
  )
})
