# Bug template

```markdown
## Summary

[One paragraph: the symptom and where it surfaces. Don't theorize about
the cause in the summary — describe what the user/observer sees.]

## Observed behavior

[Exact behavior. Include error messages, screenshots, request/response
samples, stack traces — whatever you have. Quote verbatim.]

## Expected behavior

[What should happen instead.]

## Reproduction

1. [Smallest steps that produce the bug]
2. [...]
3. [...]

Environment:

- [ ] Reproduces in dev (`pnpm dev`)
- [ ] Reproduces in the Cloudflare Workers runtime (`pnpm prod`)
- [ ] Reproduces in production / preview deployment
- [ ] Specific page / component / locale required: [details]

## Suspected cause

[Optional. Your best guess at the root cause + file:line refs. Mark as
"suspected" — the implementer should still verify.]

## Acceptance criteria

- [ ] [Specific test or check that proves the bug is fixed]
- [ ] Regression test added (Vitest — pure logic, or component markup via `renderToStaticMarkup`)
- [ ] Related code paths reviewed for the same class of bug
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test:run` pass

## Files likely affected

- `...` — [why]

## References

- Sentry: [link if available]
- Related PR / issue: #NNN
```

## Notes for the drafter

- A bug ticket without reproduction steps is half a bug ticket. If you can't reproduce, say so explicitly and ask the reporter for steps.
- For Sentry-reported errors: link the Sentry issue, attach the stack trace (Sentry MCP is available).
- For data/rendering bugs, note the page/locale and whether the CMS response is involved (`server/cms-client.ts`) vs. a pure rendering issue.
- For Cloudflare-runtime-only bugs (KV, edge SSR), say so — they reproduce under `pnpm prod`, not always `pnpm dev`.
