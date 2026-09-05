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
- Everything else uses Tailwind's defaults for spacing, font sizes, shadows, and animation

In Tailwind v4, theme customization lives in CSS through `@theme`, not in `tailwind.config.ts`.
`tailwind.config.ts` only lists content paths for class detection.

**Fonts**: [layouts/fonts.css](../../layouts/fonts.css) loads the web fonts:
- Raleway, weights 200–700 — the primary font family
- Futura Book, weight 400 — the secondary font family
- WeMeditate Icons — a custom icon font
- Font files live in [public/fonts/](../../public/fonts/), in WOFF2 and WOFF
- Every `@font-face` rule sets `font-display: swap`
