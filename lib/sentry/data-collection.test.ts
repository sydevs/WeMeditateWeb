import { describe, it, expect } from 'vitest'

import { LIVE_PREVIEW_PARAM } from '@/lib/live-preview/protocol'
import { sentryDataCollection } from './data-collection'

describe('sentryDataCollection', () => {
  it('denies the live-preview token in a query string', () => {
    // `scrubCredentials` reaches `event.request` only, so this deny-list is the
    // one filter that covers a span's `url.full` and `url.query`.
    expect(sentryDataCollection.urlQueryParams.deny).toContain(LIVE_PREVIEW_PARAM)
  })

  it('collects no request or response body', () => {
    // On `POST /api/submissions` that body is a visitor's name, email and message.
    expect(sentryDataCollection.httpBodies).toEqual([])
  })

  it('keeps every v10 collection default that Sentry 11 widened', () => {
    expect(sentryDataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      databaseQueryData: false,
      queues: false,
      genAI: { inputs: false, outputs: false },
      graphQL: { document: false, variables: false },
    })
  })
})
