import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HeadDefault from './+Head'
import type { LivePreviewState } from '../lib/live-preview/protocol'

/**
 * The other half of keeping the token out of third-party hands.
 *
 * Fathom reads `location.href` in JS and posts it, where no response header
 * reaches. The `location.href` scrub cannot get there first: measured on the
 * deployed preview, this `defer` tag is the first script in the document and
 * runs the moment parsing ends, while Vike's client entry is an `async` module
 * at the end of `<body>` whose body dynamically `import()`s a hashed chunk.
 *
 * So under a preview the tag is not emitted at all. That is a structural
 * guarantee rather than a race, and it is what these specs pin.
 *
 * The host gate is pinned here too, for a different reason: a preview Worker
 * and the dev server render these same documents, and neither serves visitors
 * worth counting.
 */

const REAL_ORIGIN = 'https://wemeditate.com'

const { context } = vi.hoisted(() => ({
  context: {
    livePreview: null as LivePreviewState | null,
    origin: null as string | null,
  },
}))

vi.mock('../hooks/usePageContext', () => ({
  useOptionalPageContext: () => ({ livePreview: context.livePreview }),
  useOrigin: () => context.origin,
}))

beforeEach(() => {
  context.livePreview = null
  context.origin = REAL_ORIGIN
})

describe('HeadDefault', () => {
  it('emits the analytics script on an ordinary page view', () => {
    const html = renderToStaticMarkup(<HeadDefault />)

    expect(html).toContain('https://cdn.usefathom.com/script.js')
    expect(html).toContain('data-site="PFPCDAMQ"')
    // Deferred, so it never blocks the parser.
    expect(html).toContain('defer=""')
  })

  it('counts a client-side navigation, which Fathom does not do by default', () => {
    expect(renderToStaticMarkup(<HeadDefault />)).toContain('data-spa="auto"')
  })

  it('emits no analytics script under a live preview', () => {
    context.livePreview = { active: true, scope: null }

    const html = renderToStaticMarkup(<HeadDefault />)

    expect(html).not.toContain('usefathom')
  })

  it('emits it again once the session is over', () => {
    context.livePreview = { active: false, scope: null }

    expect(renderToStaticMarkup(<HeadDefault />)).toContain('usefathom')
  })

  it('emits no analytics script on a preview Worker', () => {
    context.origin = 'https://wemeditate-web-preview-103.workers.dev'

    expect(renderToStaticMarkup(<HeadDefault />)).not.toContain('usefathom')
  })

  it('emits no analytics script when the serving origin is unknown', () => {
    context.origin = null

    expect(renderToStaticMarkup(<HeadDefault />)).not.toContain('usefathom')
  })
})
