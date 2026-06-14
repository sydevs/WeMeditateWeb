# Well-formed issue examples

Reference examples from this repo. Read these before drafting to calibrate tone and depth. (`gh issue view <n>` to read the full body.)

## Sequenced feature spec — issue #24

**Title:** `Pages: baseline rich-text renderer (body + author + featuredVideo + SEO)`

**What makes it good:**

- Summary states the concrete replacement ("replace the raw-JSON `<pre>` dump in `PageTemplate.tsx` with a real rich-text renderer") and names the file.
- Explicitly scopes itself as **ticket 1 of 4** with a stated order ("1 → 2 → 3 → 4", "one ticket = one PR") so the work splits cleanly.
- Background grounds the implementer in the data shape (`page.content` is Lexical JSON via `getPageBySlug`) and surfaces a real risk (the Lexical converter pulling `node:` builtins that break the Workers bundle) with a fallback plan.
- Acceptance criteria are observable end states (renders formatted text, video plays in **both Chrome and Safari**, correct `<head>` tags).

**Use as template for:** large features that must be split into an ordered series of PRs.

---

## Dependent follow-up with an inventory table — issue #25

**Title:** `Pages: custom Lexical block renderers (10 blocks)`

**What makes it good:**

- States the dependency up front (**Depends on #24**) and that most blocks map onto **existing** components — so it's "wiring + a few new components," setting reviewer expectations.
- A table maps each of the 10 block slugs → fields → the target component, making blast radius and reuse explicit.
- Phases the single PR (static reuse → populated/relationship → dynamic fetch) and flags a concrete constraint (depth bump must not blow KV cache-entry size limits).
- ACs include the project's gate (`pnpm exec tsc --noEmit` and `pnpm test:run` pass).

**Use as template for:** feature work that's mostly composition over existing components.

---

## Additive enhancement on working code — issue #26

**Title:** `Meditations: music offering + related content`

**What makes it good:**

- Frames the change as **additive** to already-working code ("`MeditationTemplate` + `MeditationPlayer` already work").
- Points at the existing reusable fetcher (`getSongsByTags` already exists in `server/cms-client.ts`) rather than implying new code — avoids reinventing.
- Closes with an explicit **Risks / Open Questions** section (where the `includeForMeditations` flag lives; whether "related" is meditations-only) — the unknowns are surfaced, not buried.

**Use as template for:** enhancements that extend a working feature using data/utilities that already exist.

---

## New content type, end-to-end — issue #27

**Title:** `Lectures: HLS video renderer, routes & live preview`

**What makes it good:**

- States the gap plainly ("currently entirely absent from the frontend — no fetcher, route, template, player, or preview") and that it **reuses the shared `VideoPlayer` from #24**.
- Enumerates the **4 live-preview touch points** that must change together — the kind of cross-cutting detail that causes PR-review churn when omitted.
- Files-touched section lists every path, making the blast radius reviewable before any code is written.

**Use as template for:** introducing a whole content type / vertical slice that spans data, routes, components, and preview.

---

## Research-backed framework introduction — issue #14

**Title:** `Introduce Zod Validation Framework for Environment Variables, API Responses, Forms, and Routes`

**What makes it good:**

- Leads with **Motivation** (compile-time-only types, manual checks, unchecked `as Type` assertions) before the solution — the "why" justifies the dependency.
- Includes a **Research** section documenting a real constraint (Vite's static `import.meta.env` replacement) with a working vs. broken code snippet — saves the implementer a discovery cycle.
- Phased implementation plan with exact install commands and files to create/modify.

**Use as template for:** introducing a new library or cross-cutting pattern where the rationale and constraints need to be established first.

---

## Pattern observations

Across well-formed issues in this repo:

1. **Code-level specificity.** Issues name files (`server/cms-client.ts`, `PageTemplate.tsx`), data fields, and existing utilities. Vague "improve X" tickets don't appear.
2. **Reuse first.** Good tickets point at the component/fetcher that already exists and should be reused, instead of implying new code.
3. **Scope + sequencing surfaced.** "One ticket = one PR," dependency notes (`Depends on #24`), and ordered series keep PRs reviewable.
4. **Constraints called out.** Cloudflare Workers bundle safety, KV cache-entry size, locale behavior, Safari HLS — the stack's footguns are named.
5. **Acceptance criteria as a checklist**, ending with the project's gate (`pnpm exec tsc --noEmit`, `pnpm test:run`, cross-browser checks).

A draft that hits all five is in good shape.
