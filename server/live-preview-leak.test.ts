import { describe, expect, it } from 'vitest'
import { toClientState, type LivePreviewSession } from './live-preview'

/**
 * ⚠ The one assertion standing between the credential and the page source.
 *
 * `passToClient` serialises `pageContext.livePreview` into the HTML. A future
 * change that put the session on there directly — or added a field to
 * `LivePreviewState` — would ship the token to every browser, in a form nobody
 * would notice until it turned up in a bug report.
 */
describe('toClientState', () => {
  it('carries the verdict and nothing else', () => {
    const session: LivePreviewSession = {
      active: true,
      scope: 'wm-web-translations',
      token: 'a.very-secret-token',
    }

    const client = toClientState(session)

    expect(client).toEqual({ active: true, scope: 'wm-web-translations' })
    expect(JSON.stringify(client)).not.toContain('very-secret-token')
    expect(Object.keys(client)).toEqual(['active', 'scope'])
  })
})
