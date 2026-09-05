import * as Sentry from "@sentry/react";

export const sentryBrowserConfig = () => {
  // eslint-disable-next-line
  import.meta.env.PROD === true &&
    Sentry.init({
      dsn: import.meta.env.PUBLIC__SENTRY_DSN,
      environment: "production-frontend",
      integrations: [Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
};
