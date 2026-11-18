import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { Page } from '../../server/sahajcloud-types'
import { classOf } from '../../tests/_helpers/markup'
import { PageTemplate } from './PageTemplate'

// PageTemplate calls usePageHead → vike-react's useConfig, which needs vike's
// page context (absent in a bare node render). Stub it to a no-op setter.
vi.mock('vike-react/useConfig', () => ({
  useConfig: () => () => {},
}))

// VideoPlayer is wrapped in vike-react's ClientOnly; render its fallback (what
// it renders server-side) so a page with a featured video still produces markup.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

/** Empty Lexical editor state — no lead splash, no body content. */
const emptyContent = {
  root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 },
}

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: 1,
    slug: 'meditate',
    title: 'Meditate Now',
    content: emptyContent,
    author: null,
    featuredVideo: null,
    meta: null,
    ...overrides,
  } as unknown as Page
}

describe('<PageTemplate> hideTitle', () => {
  it('renders the PageTitle by default', () => {
    const html = renderToStaticMarkup(<PageTemplate page={makePage()} />)

    expect(html).toContain('Meditate Now')
  })

  it('omits the PageTitle banner when hideTitle is true, keeping one heading', () => {
    const html = renderToStaticMarkup(<PageTemplate hideTitle page={makePage()} />)

    // `hideTitle` suppresses a banner a visitor does not need, not the page's
    // only `<h1>` — a featured-nav page with no lead splash had none (#278).
    expect(classOf(html, 'h1')).toContain('sr-only')
    expect(html).toContain('Meditate Now')
    // The banner's own gradient box is what goes.
    expect(html).not.toContain('before:to-teal-200/30')
  })

  it('still renders the header (author byline) when hideTitle hides only the title', () => {
    const page = makePage({
      author: { id: 7, name: 'Shri Mataji' },
    } as unknown as Partial<Page>)

    const html = renderToStaticMarkup(<PageTemplate hideTitle page={page} />)

    // Banner suppressed, but the byline keeps the header container present.
    expect(html).not.toContain('before:to-teal-200/30')
    expect(html).toContain('Shri Mataji')
  })
})
