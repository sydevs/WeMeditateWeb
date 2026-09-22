import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPopulateRequestHandler, LivePreviewDocument } from './document'
import { LIVE_PREVIEW_TOKEN_HEADER } from './protocol'
import type { LivePreviewState } from './protocol'

const { livePreview, subscribed } = vi.hoisted(() => ({
  livePreview: { state: null as LivePreviewState | null },
  subscribed: vi.fn(),
}))

// The real `useDocumentPreviewActive` runs; only its source of truth is stubbed.
vi.mock('../../hooks/usePageContext', () => ({
  useOptionalPageContext: () => ({ livePreview: livePreview.state }),
}))

vi.mock('@payloadcms/live-preview-react', () => ({
  useLivePreview: <T,>(props: { initialData: T }) => {
    subscribed(props)

    return { data: props.initialData, isLoading: false }
  },
}))

beforeEach(() => {
  subscribed.mockReset()
  livePreview.state = null
  vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', 'https://cloud.sydevelopers.com')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

/**
 * ⚠ The invariant that replaces the document filter deleted from the old
 * hand-written stream.
 *
 * `useLivePreview` cannot be told which document a page shows, so it merges any
 * message carrying either slug. What keeps that safe is that a subscriber
 * exists at all only for an UNSCOPED session: SahajCloud emits
 * `scope=wm-web-config` / `scope=wm-web-translations` when the panel is editing
 * a global, and a globals preview must leave the page itself published.
 *
 * Mounting it unconditionally would also attach a listener and fire the
 * `ready()` handshake on every ordinary page view.
 */
describe('LivePreviewDocument', () => {
  function render() {
    return renderToStaticMarkup(
      <LivePreviewDocument initialData={{ id: 7, title: 'Morning' }} slug="meditations">
        {(document) => <span>{String(document.title)}</span>}
      </LivePreviewDocument>,
    )
  }

  it('subscribes for an active, unscoped session', () => {
    livePreview.state = { active: true, scope: null }

    expect(render()).toBe('<span>Morning</span>')
    expect(subscribed).toHaveBeenCalledTimes(1)
  })

  it('does not subscribe for a scoped session', () => {
    for (const scope of ['wm-web-config', 'wm-web-translations'] as const) {
      livePreview.state = { active: true, scope }

      expect(render()).toBe('<span>Morning</span>')
      expect(subscribed).not.toHaveBeenCalled()
    }
  })

  it('does not subscribe off-preview', () => {
    livePreview.state = { active: false, scope: null }
    expect(render()).toBe('<span>Morning</span>')

    livePreview.state = null
    expect(render()).toBe('<span>Morning</span>')

    expect(subscribed).not.toHaveBeenCalled()
  })

  it('does not subscribe when the SahajCloud origin is unset', () => {
    // Fails CLOSED: `isLivePreviewEvent` compares `event.origin` for equality
    // and `ready()` posts to the same value.
    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', '')
    livePreview.state = { active: true, scope: null }

    expect(render()).toBe('<span>Morning</span>')
    expect(subscribed).not.toHaveBeenCalled()
  })
})

/**
 * The handler is where the SDK leaves three things to the caller: which
 * document a message is about, what a failed populate renders, and the
 * credential. `mergeData` calls `.json()` on whatever comes back, with no
 * try/catch and no status check.
 */
describe('createPopulateRequestHandler', () => {
  const CURRENT = { id: 1, title: 'On screen' }
  const POPULATED = { id: 1, title: 'Edited', narrator: { id: 4, name: 'Mataji' } }

  function handler(options: { token?: string | null } = {}) {
    return createPopulateRequestHandler({
      slug: 'pages',
      token: () => (options.token === undefined ? 'a.valid.token' : options.token),
      lastGood: () => CURRENT,
    })
  }

  function call(
    handle: ReturnType<typeof createPopulateRequestHandler>,
    endpoint: string,
    data: Record<string, unknown> = { data: { id: 1, title: 'Edited' }, locale: 'en' },
  ) {
    return handle({
      apiPath: '/api',
      data,
      endpoint,
      serverURL: 'https://cloud.sydevelopers.com',
    })
  }

  function stubFetch(response: Response | Error) {
    const fetchMock = vi.fn(() =>
      response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
    )

    vi.stubGlobal('fetch', fetchMock)

    return fetchMock
  }

  it('populates the document, and answers with what SahajCloud returned', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(POPULATED)))

    const response = await call(handler(), 'pages/1')

    expect(await response.json()).toEqual(POPULATED)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]

    expect(url).toBe('/api/live-preview/populate?endpoint=pages%2F1')
    expect((init.headers as Record<string, string>)[LIVE_PREVIEW_TOKEN_HEADER]).toBe(
      'a.valid.token',
    )
    expect(JSON.parse(init.body as string)).toEqual({
      data: { id: 1, title: 'Edited' },
      locale: 'en',
    })
  })

  it('refuses an endpoint naming another collection, without calling the proxy', async () => {
    // `mergeData` builds the endpoint from the MESSAGE's slug and OUR id, so
    // this is the one place a message about another document can be caught.
    const fetchMock = stubFetch(new Response(JSON.stringify(POPULATED)))

    const response = await call(handler(), 'regions/1')

    expect(await response.json()).toEqual(CURRENT)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a global, and a sibling document of the same collection', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(POPULATED)))

    expect(await (await call(handler(), 'globals/wm-web-config')).json()).toEqual(CURRENT)
    expect(
      await (await call(handler(), 'pages/1', { data: { id: 2, title: 'Another page' } })).json(),
    ).toEqual(CURRENT)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the document on screen when the proxy refuses', async () => {
    // The 403 body would otherwise be merged in and rendered as the document.
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ errors: [{ message: 'no' }] }), { status: 403 }),
    )

    expect(await (await call(handler(), 'pages/1')).json()).toEqual(CURRENT)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps the document on screen when the request rejects', async () => {
    stubFetch(new Error('offline'))

    expect(await (await call(handler(), 'pages/1')).json()).toEqual(CURRENT)
  })

  it('keeps the document on screen when the answer is not a JSON object', async () => {
    // `mergeData` calls `.json()` outside any try/catch of ours, so a malformed
    // body has to fail here, where there is something to fall back to.
    stubFetch(new Response('<html>502</html>'))
    expect(await (await call(handler(), 'pages/1')).json()).toEqual(CURRENT)

    stubFetch(new Response(JSON.stringify(['not', 'a', 'document'])))
    expect(await (await call(handler(), 'pages/1')).json()).toEqual(CURRENT)
  })

  it('does not call the proxy without a token', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(POPULATED)))

    expect(await (await call(handler({ token: null }), 'pages/1')).json()).toEqual(CURRENT)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
