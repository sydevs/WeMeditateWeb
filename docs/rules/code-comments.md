---
description: When a code comment earns its place, and which comments must never be deleted.
---

# Code comments

<!-- canonical:start — synced from claude-workflow/docs/code-comments.md. Edit there, not here. -->

- **Default to no comment.** Code shows *how*. A comment earns its place only by carrying *why* — a
  non-obvious constraint, a deliberate deviation, a gotcha, a workaround, or the reason a simpler
  version is wrong.
- **Never narrate the code.** No "loop over the users", no restating a name, a type or a signature,
  no `} // end if`.
- **Never narrate the change.** No "updated to", "as requested", "fixed the off-by-one". A comment
  must read correctly to someone who opens the file fresh and never saw the diff. Change context
  belongs in the commit message.
- **Never point at a moving target.** A spec section, a requirements doc, a design doc — all get
  superseded. Encode the substance instead. A ticket number, an RFC, a permalink, or a maintained
  doc at a stable path stays fine as a breadcrumb.
- **Apply the razor to every comment you keep, not only to the ones you cut.** "Carries a real
  *why*" and "is worded minimally" are separate judgements. A genuine *why* can still be three times
  too long. A five-line block rarely survives intact.
- **A one-line summary on a public function or endpoint is fine.** Restating a single clear line
  never is.
- **Never delete a tool directive, a `⚠` line, a cross-repo sync pointer, or a `#NNN` breadcrumb.**
  Directives change what a compiler, linter or formatter does. `⚠` is this workspace's own
  load-bearing marker. Nothing but prose enforces the couplings between these five repos.

TODOs are fine and need no issue ID. A TODO is a marker, not a substitute for the work.

<!-- canonical:end -->

## Carve-outs for this repo

- **Sync pointers to SahajCloud's API shape are load-bearing.** `server/cms-client.ts` explains that
  a read without `select` returns `url: null` on an upload, and that the CMS query-validation hook
  400s without it. Delete that and the file's whole structure becomes inexplicable.
- **Component stories**: Ladle renders a story's leading JSDoc as its description. Collapsing one is
  a silent docs-UI regression, not a test failure.

`components/` carries most of this repo's narration. `server/` and `lib/` are already tight.
