# Enhancement / Refactor template

```markdown
## Summary

[1 paragraph: what we're improving and why. Enhancement = behavior change
to existing feature. Refactor = no behavior change, internal structure
only. Be clear which this is.]

## Current state

[How it works today. Reference specific code locations. What's painful
about it?]

## Proposed change

[What the new shape looks like. Include before/after snippets if helpful.]

## Constraints

- [What must NOT break — locale behavior, caching, SSR/edge compatibility, etc.]
- [Performance / bundle-size / latency budgets]
- [Backward compatibility with existing CMS responses]

## Acceptance criteria

- [ ] [Testable condition #1]
- [ ] [Testable condition #2]
- [ ] No regressions in existing tests (`pnpm test:run` passes)
- [ ] [For refactors: behavior verified unchanged by existing tests; no test
      modifications required]

## Files affected

- `...` — [what changes]

## References

- Related PR: #NNN
- Discussion: [link]
```

## Notes for the drafter

- **Refactors should be behavior-preserving.** If existing tests need to change, it's no longer a pure refactor — call it out and explain why.
- For large refactors: consider proposing a split — land the structural change first, then the behavior change.
- For component refactors: note whether the Ladle story and DESIGN_SYSTEM.md guidance need updating, and prefer existing component variants over new custom className.
- For performance work (e.g. load time, bundle size): include the metric you're optimizing for and the measurement method.
