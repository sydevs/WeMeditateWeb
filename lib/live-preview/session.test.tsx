import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { sahajCloudOrigin, useDocumentPreviewActive, useLivePreviewState } from './session'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('sahajCloudOrigin', () => {
  it('reduces the configured CMS URL to a bare origin', () => {
    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', 'https://cloud.sydevelopers.com/admin')

    expect(sahajCloudOrigin()).toBe('https://cloud.sydevelopers.com')
  })

  /**
   * ⚠ Every caller must fail CLOSED on `undefined`. Returning `'*'` here, or a
   * raw unparsed string, is what turned the meditation seek channel into one
   * any page could drive.
   */
  it('is undefined when the URL is unset or unparseable', () => {
    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', '')
    expect(sahajCloudOrigin()).toBeUndefined()

    vi.stubEnv('PUBLIC__SAHAJCLOUD_URL', 'not a url')
    expect(sahajCloudOrigin()).toBeUndefined()
  })
})

/**
 * The accessors read `pageContext`, which vike-react publishes through a React
 * context. Outside a Vike render — Ladle, and every SSR-string test in this
 * repo, including `layouts/LayoutRoot.test.tsx` — there is no provider, and
 * `usePageContext` returns `undefined`. Taking the root layout down over a
 * preview flag would be a poor trade, so these report "not a preview"
 * instead.
 */
describe('the live-preview accessors, with no Vike provider', () => {
  function Probe() {
    const { active, scope } = useLivePreviewState()

    return <span>{`${active}:${String(scope)}:${useDocumentPreviewActive()}`}</span>
  }

  it('report an inactive session rather than throwing', () => {
    expect(renderToStaticMarkup(<Probe />)).toBe('<span>false:null:false</span>')
  })
})
