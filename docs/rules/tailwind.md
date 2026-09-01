---
paths:
  - "layouts/*.css"
  - "tailwind.config.ts"
---

# Tailwind CSS

Tailwind v4.1.16 is configured via `@tailwindcss/vite` plugin using the **CSS-first configuration approach**.

**Theme Configuration**: [layouts/tailwind.css](../../layouts/tailwind.css) - Uses `@theme` directive for customization:
- Brand colors (teal, coral, gray palettes with semantic colors)
- Typography (Raleway and Futura Book fonts with weights 200-700)
- Custom font weights (200-700)
- Semantic colors (error, success, info)
- Uses Tailwind CSS defaults for spacing, font sizes, shadows, and animations

**Important**: In Tailwind v4, theme customization is done via the `@theme` directive in CSS, NOT in `tailwind.config.ts`. The config file only specifies content paths for class detection.

**Fonts**: Web fonts are loaded via [layouts/fonts.css](../../layouts/fonts.css):
- Raleway (weights: 200, 300, 400, 500, 600, 700) - Primary font family
- Futura Book (weight: 400) - Secondary font family
- WeMeditate Icons - Custom icon font
- Font files located in [public/fonts/](../../public/fonts/) (WOFF2 + WOFF formats)
- Uses `font-display: swap` for optimal performance

