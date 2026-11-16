const PII_KEY_SNIPPETS = ['forwarded', '-ip', 'remote-', 'via', '-user']

/**
 * The v10 default for what the Sentry SDKs collect, spelled out for v11.
 *
 * ⚠ Sentry 11 replaced `sendDefaultPii` with `dataCollection`, and left unset it
 * now collects user info, cookies, request and response bodies and database
 * query data. Neither init ever set `sendDefaultPii`, so v10 collected none of
 * that. Pass this object to `Sentry.init` on both the server and the browser;
 * leaving `dataCollection` out would widen collection silently.
 */
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: PII_KEY_SNIPPETS },
    response: { deny: PII_KEY_SNIPPETS },
  },
  httpBodies: [],
  urlQueryParams: { deny: PII_KEY_SNIPPETS },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
}
