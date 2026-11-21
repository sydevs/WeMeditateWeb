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

import { describe, it, expect, vi, afterAll, beforeEach, afterEach } from 'vitest'
import { writeFileSync } from 'node:fs'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import axe, { type Result, type RunOptions } from 'axe-core'
import { EN_TRANSLATIONS, enT } from '../../lib/i18n'
import { pageSeo } from '../../lib/content-seo'
import { MAIN_CONTENT_ID } from '../../lib/route-announcer'
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

/**
 * Rules jsdom cannot decide, disabled by name so they are visibly out of scope
 * rather than silently not firing.
 *
 * `color-contrast` and `target-size` need a drawn box, and the decision of
 * 2026-10-21 moved both to the walk-through. `page-has-heading-one` and
 * `landmark-one-main` are different: axe cannot confirm it is looking at a top
 * frame here, so it answers `incomplete` for both **even when the `<h1>` and
 * the `<main>` are present** — measured against axe-core@4.14.0. Leaving them
 * on would fail every target forever, and counting `incomplete` as a pass
 * would make them decorative. `the structural contract` below asserts both
 * directly instead, which is stronger: it counts the elements.
 */
const UNDECIDABLE = ['color-contrast', 'target-size', 'page-has-heading-one', 'landmark-one-main']

/**
 * The two further rules an embed cannot satisfy, because it has no chrome: it
 * is a fragment of someone else's page, with no landmark to contain its content
 * and no menu to skip past. Nothing else is relaxed for them.
 */
const CHROME_ONLY = ['region', 'bypass']

function options(exclude: string[]): RunOptions {
  return {
    runOnly: { type: 'tag', values: TAGS },
    rules: Object.fromEntries(exclude.map((id) => [id, { enabled: false }])),
  }
}

/**
 * Everything a server render can put in the tab order. `[tabindex]` covers both
 * directions: a `-1` stop would be a finding here, not an omission.
 */
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]'

/**
 * The `seo` document the route's `+data.ts` hands a content page. The article
 * target draws its share row from the canonical in it, so a target without one
 * would leave axe walking a page missing the row.
 */
const seoFor = (page: typeof articlePage, path: string) =>
  pageSeo({
    page,
    settings: webConfig,
    locales: [],
    route: { origin: 'https://wemeditate.com', path, locale: 'en', t: enT },
  })

/** Every target, as the gate's own output names them. */
const TARGETS = [
  {
    name: 'home',
    chrome: true,
    render: () => {
      routeData.current = { settings: webConfig, page: homePage, seo: seoFor(homePage, '/') }

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
      routeData.current = {
        settings: webConfig,
        page: articlePage,
        seo: seoFor(articlePage, `/${articlePage.slug}`),
      }

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
      routeData.current = { settings: webConfig, atlas: atlasSeo, atlasRoute: null }

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

/** Findings, as `<rule-id> (<impact>): <node count>`, so a failure reads. */
function describeResults(results: Result[], label: string): string[] {
  return results.map(
    (result) =>
      `${result.id} (${label}, ${result.impact ?? 'unknown'}): ${result.nodes.length} node(s) — ` +
      result.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | '),
  )
}

async function violationsFor(target: (typeof TARGETS)[number]): Promise<string[]> {
  mountDocument(renderToStaticMarkup(target.render()))

  // The whole document, not `document.body`: axe runs its page-level rules —
  // `page-has-heading-one`, `landmark-one-main`, `region`, `bypass` — only when
  // the context is the document itself, and silently skips all four over a
  // fragment. Three of this goal's own lines are those rules.
  const result = await axe.run(
    document,
    options(target.chrome ? UNDECIDABLE : [...UNDECIDABLE, ...CHROME_ONLY]),
  )
  // `incomplete` counts too. axe decides `page-has-heading-one` and
  // `landmark-one-main` from a check that answers `undefined` rather than
  // `false`, so both land there and never in `violations` — and they are two of
  // this goal's own lines. The two rules that genuinely cannot be decided
  // without layout are already off by name, so anything left here is a finding
  // a reviewer owes an answer, not noise.
  const violations = [
    ...describeResults(result.violations, 'violation'),
    ...describeResults(result.incomplete, 'needs review'),
  ]

  report.push({ target: target.name, violations })

  return violations
}

/**
 * Per-target counts for the job summary, written whether the run passed or
 * failed — `scripts/a11y-summary.mjs` is what makes the result visible on the
 * pull request without anyone asking for it.
 */
const report: { target: string; violations: string[] }[] = []

/**
 * Where the counts land. `scripts/a11y-summary.mjs` defaults to this name and
 * `.gitignore` lists it, so the three have to agree.
 */
const A11Y_REPORT_PATH = 'a11y-report.json'

describe('accessibility · page types', () => {
  afterAll(() => {
    writeFileSync(A11Y_REPORT_PATH, `${JSON.stringify({ targets: report }, null, 2)}\n`)
  })

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('runs the rule set the goal asks for, with only the undecidable rules off', () => {
    // Without this, dropping `best-practice` would silently stop the gate
    // seeing `heading-order` and `landmark-unique`, two of the goal's own lines.
    expect(TAGS).toContain('best-practice')

    // The literal lists, not `options()`'s own output: that is built from the
    // array handed to it, so comparing the two restates the input and would
    // pass with any rule added to either list.
    expect(UNDECIDABLE).toEqual([
      'color-contrast',
      'target-size',
      'page-has-heading-one',
      'landmark-one-main',
    ])
    expect(CHROME_ONLY).toEqual(['region', 'bypass'])
  })

  it('keeps the Dropdown atom on the path the gate walks', () => {
    // `nested-interactive` is one of this gate's own lines, and the `Dropdown`
    // atom is where that defect lived. The footer's language menu is the only
    // thing any target renders through it, so without this the rule could go
    // on passing over a tree that no longer holds the element it is aimed at.
    const home = TARGETS.find((target) => target.name === 'home')

    if (!home) throw new Error('the home target is gone')

    mountDocument(renderToStaticMarkup(home.render()))

    expect(document.querySelectorAll('[aria-haspopup="menu"]')).toHaveLength(1)
  })

  it.each(TARGETS.map((target) => [target.name, target] as const))(
    '%s renders the structural contract axe cannot decide here',
    (_name, target) => {
      mountDocument(renderToStaticMarkup(target.render()))

      const count = (selector: string) => document.querySelectorAll(selector).length

      // A page type owes exactly one outline root and one main landmark; an
      // embed owes neither, because it is a fragment of someone else's page.
      expect({ h1: count('h1'), main: count('main') }).toEqual(
        target.chrome ? { h1: 1, main: 1 } : { h1: 0, main: 0 },
      )

      // The skip link is reached in DOM order, which paint order does not
      // change — so a lead splash's absolutely positioned header overlay
      // cannot take the first stop from it. An embed renders none: it has no
      // menus to skip and no `<main>` to point at.
      const first = document.querySelector(FOCUSABLE)

      expect(first?.getAttribute('href') ?? null).toBe(target.chrome ? `#${MAIN_CONTENT_ID}` : null)
      expect(count(`a[href="#${MAIN_CONTENT_ID}"]`)).toBe(target.chrome ? 1 : 0)
    },
  )

  it.each(TARGETS.map((target) => [target.name, target] as const))(
    '%s has no axe violations',
    async (_name, target) => {
      expect(await violationsFor(target)).toEqual([])
    },
    30_000,
  )
})
