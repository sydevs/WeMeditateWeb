import { apply, serve } from '@photonjs/hono'
import { withSentry, type Event } from '@sentry/cloudflare'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import type { SahajCloudEnv } from './sahajcloud/context'
import { registerLegacyRedirects } from './legacy-redirects'
import { registerRoutes } from './routes'
import { LIVE_PREVIEW_PARAM } from '@/lib/live-preview/protocol'
import { stripLivePreviewToken } from '@/lib/live-preview/token-url'
import { sentryDataCollection } from '@/lib/sentry/data-collection'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

/**
 * Header names whose value is a credential, matched as a lowercase substring so
 * a header added later is covered by its name rather than by an edit here.
 *
 * ⚠ A backstop, not the only guard. Sentry 11 filters a header whose name
 * matches its own `SENSITIVE_KEY_SNIPPETS`, which today covers all four
 * snippets below, on top of the `PII_KEY_SNIPPETS` deny-list this Worker now
 * passes for request and response headers alike. That built-in list is
 * SDK-internal and can narrow in a minor, and what rides on it is this
 * Worker's two inbound credentials — the live-preview token
 * (`x-sahajcloud-preview-secret`) and the Turnstile token — which otherwise
 * arrive in plaintext and outlive the session they were minted for
 * (lib/live-preview/token-url.ts says what that costs).
 */
const CREDENTIAL_HEADER_SNIPPETS = ['secret', 'token', 'auth', 'key']

/**
 * Removes every credential this Worker's requests carry from an outgoing event.
 *
 * ⚠ Called from `beforeSend` **and** `beforeSendTransaction`. A transaction is
 * not an error event, so `beforeSend` never sees one, and `tracesSampleRate`
 * comes from `SENTRY_TRACES_SAMPLE_RATE` in the Worker env — so tracing can be
 * switched on from the Cloudflare dashboard, the same place `SENTRY_DSN` is
 * set, with no change here.
 */
function scrubCredentials<E extends Event>(event: E): E {
  const request = event.request

  if (!request) return event

  // A live-preview request carries its token in the query string, which Sentry
  // records twice: in `url` and in `query_string`. The browser keeps the token
  // out of Sentry too (lib/live-preview/token-url.ts).
  request.url &&= stripLivePreviewToken(request.url)
  delete request.query_string

  // ⚠ A backstop. `httpBodies: []` (lib/sentry/data-collection.ts) is what
  // keeps the inbound body off the event: `httpServerIntegration` ships with no
  // `maxRequestBodySize`, so that option alone decides whether the body is
  // buffered, and an empty list means it never is. This line is what holds if
  // the option is ever widened, because on `POST /api/submissions` the body is
  // the visitor's name, email address and message, and nothing needs it to
  // debug these paths — the upstream error body is already in the request log
  // (server/sahajcloud/fetch.ts).
  delete request.data

  const { headers } = request

  if (headers) {
    for (const name of Object.keys(headers)) {
      const lower = name.toLowerCase()

      if (CREDENTIAL_HEADER_SNIPPETS.some((snippet) => lower.includes(snippet))) {
        headers[name] = '[Filtered]'
      }
    }
  }

  return event
}

// `serve()` returns `{ fetch, server }` and photon's Cloudflare entry spreads it
// into the Worker export, so wrapping it here initialises Sentry for every
// request. Every server-side `Sentry.capture*` depends on it.
export default withSentry(
  (env: SahajCloudEnv['Bindings']) => ({
    dsn: env.SENTRY_DSN,
    environment: 'production-backend',
    dataCollection: sentryDataCollection,
    // ⚠ Sentry 11 streams spans by default, and a streamed span never reaches
    // `beforeSendTransaction`, so `scrubCredentials` would stop running on
    // traced requests.
    // shortcut: the static lifecycle keeps beforeSendTransaction, which v12
    // removes; upgrade when scrubCredentials can scrub streamed span attributes
    traceLifecycle: 'static',
    beforeSend: scrubCredentials,
    beforeSendTransaction: scrubCredentials,
  }),
  startServer(),
)

function startServer() {
  const app = new Hono<SahajCloudEnv>()

  // Enable context storage for AsyncLocalStorage-based config access
  // This MUST be registered before other middleware
  app.use(contextStorage())

  // A live-preview response must never be stored or indexed.
  //
  // ⚠ **Registered before the routes.** Hono runs handlers in registration
  // order and a route handler returns without calling `next()`, so middleware
  // added after `registerRoutes` would never run for those paths at all.
  //
  // ⚠ **After `next()`, not before.** `registerRoutes`' JSON routes set their own
  // `Cache-Control: public, max-age=300` inside the handler, so a header
  // written on the way in is overwritten on the way out.
  //
  // Presence of the parameter, not its validity: this runs outside the Vike
  // render and has no verdict to read, and a request carrying a bogus token
  // getting `no-store` it did not earn costs a slightly colder cache. The
  // alternative — a draft response stored because the token was malformed —
  // is not symmetrical with that.
  //
  // `Referrer-Policy` matters here in particular: without it the token would
  // ride the `Referer` of every subresource the preview page requests.
  app.use('*', async (c, next) => {
    await next()

    if (!c.req.query(LIVE_PREVIEW_PARAM)) return

    c.header('Cache-Control', 'no-store')
    c.header('X-Robots-Tag', 'noindex')
    c.header('Referrer-Policy', 'no-referrer')
  })

  // An old wemeditate.com address, consulted on the 404 this site would
  // otherwise answer. Registered before the routes, for the reason above.
  registerLegacyRedirects(app)

  // Every route under server/routes/, before Vike's page catch-all.
  registerRoutes(app)

  apply(app, [])

  return serve(app, {
    port,
  })
}
