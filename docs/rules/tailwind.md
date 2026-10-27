---
paths:
  - "layouts/*.css"
---

# Tailwind CSS

Tailwind v4.1.16 runs through the `@tailwindcss/vite` plugin, with CSS-first configuration.

**Theme configuration**: [layouts/tailwind.css](../../layouts/tailwind.css) sets the theme through
the `@theme` directive:
- Brand colors — teal, coral, and gray palettes, plus semantic colors (error, success, info)
- Typography — Raleway and Futura Book, weights 200–700
- Two custom animations — `--animate-pulse-scale` and `--animate-shimmer`
- Everything else uses Tailwind's defaults for spacing, font sizes and shadows

**There is no JavaScript config file, and adding one back changes nothing on its own.** v4 reads
a config file only through an `@config` directive, so a `tailwind.config.ts` that no stylesheet
points at is dead — which is what #176 deleted.

**The `@source` lines are the whole scan set.** `@import "tailwindcss" source(none)` turns
automatic source detection off, so `components/`, `pages/` and `layouts/` are all Tailwind reads.
A class-shaped string anywhere else emits nothing — a test fixture, a code comment, or a sentence
in this file. Before `source(none)`, 18 utilities in the production stylesheet came from exactly
those places, six of them from doc lines telling a reader *not* to write the class (#186).

**A new top-level directory that authors a className needs a fourth `@source` line** in
[layouts/tailwind.css](../../layouts/tailwind.css). Without one its classes compile to no CSS, and
the failure shows as an unstyled element on first render. `hooks/` is the live code directory
outside the set today, and it authors no class.

**A utility naming an undeclared token compiles to nothing, and nothing warns.**
`tests/guards/theme-utilities.test.ts` catches that by asking Tailwind. It compiles each candidate
against the real stylesheet through `candidatesToCss`, which answers `null` when the utility emits
no CSS, so the guard models no token sets and no keywords: `text-center` and `font-stretch-expanded`
compile and pass, `text-error-light` and `rounded-pill` do not and fail. Variants, a `/50` opacity
and a trailing `!` all go to the compiler as written.

**Reach** comes from Tailwind too, for the colour namespace: a root takes a colour exactly when
`<root>-<a declared colour token>` compiles, which is 51 roots today and follows a version bump on
its own. `font` and `rounded` are named by hand, because probing those namespaces needs an
ambiguous value (`lg` compiles under `w-` and `blur-` as well). A root outside that set is
unwatched, never wrongly flagged. Two shapes stay out of scope on purpose: an arbitrary value
(`text-[16px]`, `bg-(--var)`) names no token, and a match preceded by `<word>-` is a slug rather
than a utility. Stories are scanned; specs are not.

The guard also checks the scan set against the tree: every top-level directory that authors a
`className` must have an `@source` line.

**A named bundle of classes is an `@utility`, not a copied class string.** The project utilities
live in [layouts/tailwind.css](../../layouts/tailwind.css): `text-glow-light`, `text-glow-dark`,
`full-bleed`, `focus-ring`, the two touch-target utilities that
[design-system](design-system.md) documents, and the `surface-light` / `surface-dark` pair whose
tokens `@theme inline` exposes as colours (`text-fg`, `text-primary`, `border-line`, …). A rule
with a name is greppable and lintable; the same eight classes pasted into three components are
none of those things, and dropping one of them fails silently. A styling concern shared across
components keeps its CSS here; TypeScript only chooses which class to apply.

⚠ **A custom utility is emitted before Tailwind's own**, so a core utility touching the same
property wins on the same element — `min-w-0` beats `touch-target`'s `min-width`. Drop the core
class rather than stacking the two.

**A class the scanner cannot see goes in `@source inline()`, not in a literal list.** Tailwind
scans source text, so a class built at runtime — `` `sm:col-span-${span}` `` from a
SahajCloud-authored width — produces no CSS and the rule silently does nothing. Declare the range in
[layouts/tailwind.css](../../layouts/tailwind.css), beside the `@source` paths:

```css
@source inline("sm:col-span-{1..12}");
```

Scanner configuration belongs in the CSS. Writing the twelve variants out in the component to
keep them scannable puts a CSS concern in a `.tsx` file, and the next person must guess why.

**Fonts**: [layouts/fonts.css](../../layouts/fonts.css) loads the web fonts:
- Raleway, weights 200–700 — the primary font family
- Futura Book, weight 400 — the secondary font family
- WeMeditate Icons — a custom icon font
- Font files live in [public/fonts/](../../public/fonts/), in WOFF2 and WOFF
- Every `@font-face` rule sets `font-display: swap`
