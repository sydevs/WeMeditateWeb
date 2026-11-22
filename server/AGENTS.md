# Server (`server/`)

The Worker: [entry.ts](entry.ts), the routes it answers ahead of Vike, and the SahajCloud reads
both they and the pages' server hooks make.

## A route is one folder at its own path

`server/routes/` lists every route the Worker answers ahead of Vike: each one is a folder named
for its path (`/api/submissions` is `api/submissions/`, `/robots.txt` is `robots.txt/`, and a
`:param` adds no folder), holding `route.ts`, its test, and anything only that route reads. A
file whose name starts with `_` holds what the routes around it share and registers none.
[routes/index.ts](routes/index.ts) registers them all, and
[tests/guards/route-files.test.ts](../tests/guards/route-files.test.ts) holds the convention.

## Nothing outside `server/` imports from it

`server/` is server-only. What the browser shares with it lives in `lib/` (the locale rules, the
error classifier, the canonical-origin check) and `types/` (the SahajCloud shapes). ESLint
refuses an `@/server/*` import anywhere a browser can load; only `pages/**/+data.ts`,
`+onBeforeRender.ts` and the `_` loaders they call may reach in. The SahajCloud read rules are in
[sahajcloud/AGENTS.md](sahajcloud/AGENTS.md).

## The one write: a public submission, proxied same-origin

Every contact and subscribe form posts to `POST /api/submissions`
([routes/api/submissions/route.ts](routes/api/submissions/route.ts)), which forwards one
`POST /api/user-submissions` create to SahajCloud. Four things hold, and all four are load-bearing:

- **The browser cannot make that call.** The create is authenticated with `SAHAJCLOUD_API_KEY`,
  and SahajCloud answers a wildcard CORS origin with no credentials.
- **A captcha token is required on every public write**, as the `x-turnstile-token` header, not
  as document data. A request without one is answered by the proxy itself, with the 403
  `captcha_failed` SahajCloud would send. It is the only *browser* header the proxy forwards:
  `Origin` and `Referer` must not cross over, because a server-to-server call is deliberately
  exempt from the client's `allowedDomains` allowlist, which the API key stands in for. The proxy
  adds one header of its own, the visitor's address — see below.
- **The refusal envelope is `errors[].data.code`** — Payload's own `APIError` shape; the codes are
  SahajCloud's. The code is forwarded to the browser and the message never is: it is SahajCloud's
  English, written for a log, while the visitor's copy is SahajCloud-owned and rendered from a
  translation key.
- **`select` is not required here.** SahajCloud's query-validation hook gates reads only, so a
  create needs neither `select` nor `populate`. Nothing of the created row is echoed back either
  — an API client holds create and no read on `user-submissions`.

`submissionData` is the flat `[{ field, value }]` remainder, and SahajCloud accepts only the keys
it allows for the submission's type and form. An invented key comes back as a 400 naming it, and so
does a repeated one. `lib/forms/submissions.ts` owns that body; nothing else composes one.

Two things about `form` and the visitor's IP that only show in production:

- **`form` is a number.** SahajCloud resolves a quoted id to no form. It is accepted and then
  leaves the intake unable to load the form, which empties the authored-field allow-list — so
  every field the editor named is refused as unknown, while the base context set that
  `lib/forms/submissions.ts` names still passes. `submissionSchema` refuses a string at the edge so this
  cannot ship again.
- ⚠ **The proxy names the visitor, because SahajCloud cannot see them.** SahajCloud reads
  `cf-connecting-ip` off its own request for Turnstile's `remoteip`, and a proxied submission
  reaches it from this Worker's egress address. So the proxy forwards its own incoming
  `cf-connecting-ip` as `x-client-ip`, which SahajCloud prefers over the address it sees
  (sydevs/SahajCloud#808). The header is omitted, never blanked, when our own request carries no
  `cf-connecting-ip`; upstream falls back on absence and requires it from nobody.

  Two limits stand. Whether Cloudflare refuses a `remoteip` that did not solve the challenge is
  **unverified** — the always-passes test secret cannot answer it — so `remoteip` is a scoring
  hint here, and nothing depends on it being checked. And the edge rate-limit bucket still keys
  on the address SahajCloud sees, so every proxied submission shares ours.


## Sentry

- ⚠ **What Sentry may collect is declared in
  [../lib/sentry/data-collection.ts](../lib/sentry/data-collection.ts); what reaches an event
  anyway is scrubbed in `entry.ts`, not where it is captured.** `scrubCredentials` there is the
  backstop, run from `beforeSend` **and** `beforeSendTransaction` — a transaction is not an error
  event, and `SENTRY_TRACES_SAMPLE_RATE` in the Worker env can enable tracing with no code change.
  A new inbound credential header is covered only if `CREDENTIAL_HEADER_SNIPPETS` matches its name
  — check that it does.
- Import Sentry from `@sentry/cloudflare`. `withSentry` in [entry.ts](entry.ts) initialises it
  per request from the `SENTRY_DSN` secret.

## Memoise a per-request read with `perRequest`, never a bare `WeakMap`

A read that several hooks ask for goes through `perRequest` in
[server/request-memo.ts](request-memo.ts). Vike hands `data()` and `+onBeforeRender` two different
`pageContext` objects over one request, so a `WeakMap` keyed on the argument is written by the
first and missed by the second — which read `wm-web-translations` twice per chromed render until
#108. `perRequest` owns the key, so a new memo cannot get that wrong.
