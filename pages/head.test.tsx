import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import HeadDefault from './+Head'
import type { LivePreviewState } from '../lib/live-preview/protocol'

/**
 * The other half of keeping the token out of third-party hands.
 *
 * Plausible reads `location.href` in JS and posts it, where no response header
 * reaches. The address-bar scrub cannot get there first: measured on the
 * deployed preview, this `defer` tag is the first script in the document and
 * runs the moment parsing ends, while Vike's client entry is an `async` module
 * at the end of `<body>` whose body dynamically `import()`s a hashed chunk.
 *
 * So under a preview the tag is not emitted at all. That is a structural
 * guarantee rather than a race, and it is what these specs pin.
 */

const { livePreview } = vi.hoisted(() => ({
  livePreview: { state: null as LivePreviewState | null },
}))

vi.mock('../hooks/useT', () => ({
  useOptionalPageContext: () => ({ livePreview: livePreview.state }),
}))

afterEach(() => {
  livePreview.state = null
})

describe('HeadDefault', () => {
  it('emits the analytics script on an ordinary page view', () => {
    const html = renderToStaticMarkup(<HeadDefault />)

    expect(html).toContain('https://plausible.io/js/script.js')
    // Deferred, so it never blocks the parser.
    expect(html).toContain('defer=""')
  })

  it('emits no analytics script under a live preview', () => {
    livePreview.state = { active: true, scope: null }

    const html = renderToStaticMarkup(<HeadDefault />)

    expect(html).not.toContain('plausible')
  })

  it('emits it again once the session is over', () => {
    livePreview.state = { active: false, scope: null }

    expect(renderToStaticMarkup(<HeadDefault />)).toContain('plausible')
  })
})
