import * as Sentry from '@sentry/react'

import { scrubTokenFromLocation } from './lib/live-preview/token-url'

export const sentryBrowserConfig = () => {
  // ⚠ **First statement, and deliberately outside the PROD check.** Sentry
  // records request URLs and a navigation trail, so it must never initialise
  // while the live-preview token is still in `location.href`.
  //
  // Stating the precondition here is what makes it structural. It used to be
  // the client entry's line order — two calls hoisted above their own imports,
  // which any import-sorting rule would have undone with no test failing.
  // There is no cross-module order left to preserve, and the scrub early-
  // returns on a URL with no token, so the entry calling it too is free.
  //
  // This is also why there is no `beforeSend` or `beforeBreadcrumb` here.
  // Both used to strip the token from every URL Sentry was about to send.
  // With the scrub guaranteed above, Sentry starts against an already-clean
  // URL and there is nothing for either hook to find.
  scrubTokenFromLocation()

  import.meta.env.PROD === true &&
    Sentry.init({
      dsn: import.meta.env.PUBLIC__SENTRY_DSN,
      environment: 'production-frontend',
      integrations: [Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
}
