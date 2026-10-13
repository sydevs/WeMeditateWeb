---
paths:
  - "layouts/*.css"
  - "tailwind.config.ts"
---

# Tailwind CSS

Tailwind v4.1.16 runs through the `@tailwindcss/vite` plugin, with CSS-first configuration.

**Theme configuration**: [layouts/tailwind.css](../../layouts/tailwind.css) sets the theme through
the `@theme` directive:
- Brand colors — teal, coral, and gray palettes, plus semantic colors (error, success, info)
- Typography — Raleway and Futura Book, weights 200–700
- Two custom animations — `--animate-pulse-scale` and `--animate-shimmer`
- Everything else uses Tailwind's defaults for spacing, font sizes and shadows

In Tailwind v4, theme customization lives in CSS through `@theme`, not in `tailwind.config.ts`.
Nothing loads `tailwind.config.ts` at all: v4 reads a config file only through an `@config`
directive, and no stylesheet here has one. The scan set is the `@source` lines in
[layouts/tailwind.css](../../layouts/tailwind.css), so adding a path to that file's `content`
array changes nothing.

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
