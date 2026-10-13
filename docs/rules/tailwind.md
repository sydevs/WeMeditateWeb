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

**Tailwind scans wider than the `@source` lines.** `@import "tailwindcss"` also detects sources
from the project root, and the `@source` paths add to that set rather than replacing it. So a
class-shaped string outside `components/`, `pages/` and `layouts/` ships its CSS all the same —
from a test fixture, or from a sentence in this file. Spell an example without its prefix for that
reason. #186 weighs narrowing the set with `source(none)`.

**A utility naming an undeclared token compiles to nothing, and nothing warns.**
`tests/guards/theme-utilities.test.ts` catches two families of that: a colour utility whose token
sits on a scale with numeric steps, and any `font-*` utility. Nothing else is watched — a token off
such a scale, like `error-light` beside the declared `error-dark`, and namespaces such as `radius`
and `shadow` all pass. It parses the `@theme` block of
[layouts/tailwind.css](../../layouts/tailwind.css) *and* of Tailwind's own `theme.css`, because
`@theme` extends the default rather than replacing it: a `gray-950` utility resolves even though
ours stops at `gray-900`. Renaming a token on one of the two watched families fails the guard until
its call sites follow.

**Custom utilities** live in the same file as `@utility` blocks: `text-glow-*`, `full-bleed`,
`focus-ring`, and the `surface-light` / `surface-dark` pair whose tokens `@theme inline` exposes as
colours (`text-fg`, `text-primary`, `border-line`, …). A styling concern shared across
components keeps its CSS here; TypeScript only chooses which class to apply.

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
