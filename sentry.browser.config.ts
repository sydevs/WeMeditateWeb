import * as Sentry from '@sentry/react'

import { scrubLivePreviewUrl } from './lib/scrub-live-preview'

export const sentryBrowserConfig = () => {
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
          event.request.url = scrubLivePreviewUrl(event.request.url)
        }

        return event
      },
      beforeBreadcrumb(breadcrumb) {
        if (typeof breadcrumb.data?.url === 'string') {
          breadcrumb.data.url = scrubLivePreviewUrl(breadcrumb.data.url)
        }

        return breadcrumb
      },
    })
}
