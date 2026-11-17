import type { CloudflareOptions } from '@sentry/cloudflare'

import { LIVE_PREVIEW_PARAM } from './live-preview/protocol'

/**
 * ⚠ Reached through `CloudflareOptions` because `DataCollection` is exported
 * from `@sentry/core`, which is not a dependency here. Both SDKs take the same
 * type, so checking against the Worker's options covers the browser init too.
 */
type SentryDataCollection = NonNullable<CloudflareOptions['dataCollection']>

const PII_KEY_SNIPPETS = ['forwarded', '-ip', 'remote-', 'via', '-user']

/**
 * ⚠ Our own credential, which no Sentry deny-list knows. `urlQueryParams` is
 * the only filter that reaches a span's `url.full` and `url.query`:
 * `scrubCredentials` (server/entry.ts) cleans `event.request` and never
 * `event.contexts.trace.data`. Tracing turns on from the Cloudflare dashboard
 * alone, through `SENTRY_TRACES_SAMPLE_RATE`, so without this the first traced
 * live-preview request carries its JWT into Sentry.
 */
const CREDENTIAL_QUERY_SNIPPETS = [LIVE_PREVIEW_PARAM]

/**
 * The v10 default for what the Sentry SDKs collect, spelled out for v11.
 *
 * ⚠ Sentry 11 replaced `sendDefaultPii` with `dataCollection`, and left unset it
 * now collects user info, cookies, request and response bodies and database
 * query data. Neither init ever set `sendDefaultPii`, so v10 collected none of
 * that. Pass this object to `Sentry.init` on both the server and the browser;
 * leaving `dataCollection` out would widen collection silently.
 *
 * ⚠ `satisfies`, never a bare object literal. Passed to `Sentry.init` as a
 * variable this object is never checked against the SDK's shape, so a key
 * Sentry renames compiles clean and silently widens collection — the one
 * failure this file exists to prevent.
 */
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: PII_KEY_SNIPPETS },
    response: { deny: PII_KEY_SNIPPETS },
  },
  httpBodies: [],
  urlQueryParams: { deny: [...PII_KEY_SNIPPETS, ...CREDENTIAL_QUERY_SNIPPETS] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
} satisfies SentryDataCollection
