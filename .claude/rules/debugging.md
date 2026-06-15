---
description: Evidence-first debugging for this SSR + CMS app — confirm behavior with real data, not code-reading alone.
globs:
  - "**"
alwaysApply: true
---

# Debugging: confirm with evidence before concluding

Pages here are server-rendered from live PayloadCMS data, so behavior often can't be inferred from source alone. Before forming or acting on a root-cause hypothesis:

- **Fetch the real output.** `curl` the deployed preview and inspect the actual HTML (`<h1>`, nav `href`s, error markers) instead of assuming what renders.
- **Query the CMS directly.** Hit the REST API to see exactly which fields populate (e.g. whether a relationship is a populated object or a bare id) before blaming the query or the code.
- **Read the request, not just the response.** The dev server logs `[PayloadCMS] GET <url> → <status>` — use it to confirm the exact query string and status code the SDK actually sent.
- **When local is blocked, verify in CI.** A CMS **403** locally means the `.env.local` key is stale (see [local-environment](../docs/local-environment.md)); fall back to verifying against the deployed preview via CI.
- **Run an experiment to settle a fork.** When two hypotheses are plausible (e.g. "query is wrong" vs "data is unpublished"), test query variants against the real API rather than arguing from the code.

Track record from past sessions: several confident hypotheses were wrong until checked against real data. Prefer a quick curl/experiment over reasoning from source.
