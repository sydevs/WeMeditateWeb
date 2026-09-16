import * as Sentry from '@sentry/react'

import { scrubAddressBar, stripLivePreviewToken } from './lib/live-preview/token-url'

export const sentryBrowserConfig = () => {
  // ⚠ **First statement, and deliberately outside the PROD check.** Sentry
  // records request URLs and a navigation trail, so it must never initialise
  // while the live-preview token is still in `location.href`.
  //
  // Stating the precondition here is what makes it structural. It used to be
  // the client entry's line order — two calls hoisted above their own imports,
  // which any import-sorting rule would have undone with no test failing.
  // There is no cross-module order left to preserve, and `scrubAddressBar`
  // early-returns on a URL with no token, so the entry calling it too is free.
  scrubAddressBar()

  import.meta.env.PROD === true &&
    Sentry.init({
      dsn: import.meta.env.PUBLIC__SENTRY_DSN,
      environment: 'production-frontend',
      integrations: [Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // The live-preview token rides in the query string, and replay records
      // request URLs. Both hooks are needed: `beforeSend` covers the event's
      // own URL and `beforeBreadcrumb` the navigation and fetch trail, which
      // is a separate field and the one that would otherwise carry it.
      beforeSend(event) {
        if (event.request?.url) {
          event.request.url = stripLivePreviewToken(event.request.url)
        }

        return event
      },
      beforeBreadcrumb(breadcrumb) {
        if (typeof breadcrumb.data?.url === 'string') {
          breadcrumb.data.url = stripLivePreviewToken(breadcrumb.data.url)
        }

        return breadcrumb
      },
    })
}
