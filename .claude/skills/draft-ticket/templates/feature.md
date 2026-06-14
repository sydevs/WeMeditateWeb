# Feature template

```markdown
## Summary

[1-2 paragraphs: what we're adding and why. Lead with the user-facing
behavior, not implementation. Reference any prior discussion / PR / issue
that motivates this.]

## Background

[Optional. Why now? What changed? What constraints inform the design?
Skip if the Summary covers it.]

## Proposed changes

### 1. [First concrete change]

[Specifics: which files, which behavior. Use file:line refs where helpful.]

### 2. [Next concrete change]

[...]

## Acceptance criteria

- [ ] [Testable condition #1 — phrased so a reviewer can check it]
- [ ] [Testable condition #2]
- [ ] [...]
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test:run` all pass
- [ ] `pnpm build` succeeds (if build/server/Wrangler config is touched)
```

## Files affected

```markdown
- `server/cms-client.ts` — [what changes]
- `lib/Y.ts` — [what changes]
- (new) `components/molecules/Z/Z.tsx` — [purpose]
```

## References

```markdown
- Related PR: #NNN
- Related issue: #NNN
- External docs: <url>
```

## Notes for the drafter

- **Depends on CMS fields?** If the feature needs new SahajCloud fields, note that the upstream schema must change first and that `server/payload-types.ts` is regenerated via `pnpm types:cms` (never hand-edited).
- **New component?** State the atomic level (atom / molecule / organism) and that it needs a Ladle story — see DESIGN_SYSTEM.md and STORYBOOK.md.
- **New page/route?** Call out the Vike files involved (`pages/<route>/+Page.tsx`, `+data.ts`, `+route.ts`) and locale behavior.
- **New env var?** Note whether it's `PUBLIC__` (browser, build-time, set in `.env.production`) or server-only (Cloudflare dashboard secret).
