---
paths:
  - "components/**"
  - "layouts/**"
---

# Design System

This project uses the Atomic Design methodology. Before you create or classify a component, read
[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md). It holds the token values, the atomic hierarchy, the
mobile-first breakpoints, and the WCAG 2.1 AA accessibility rules. Read
[STORYBOOK.md](../../STORYBOOK.md) before you write a component story.

**Quick reference**:
- Every UI component lives under `components/`, in `atoms/`, `molecules/`, `organisms/`, or
  `templates/`. See [components/atoms/README.md](../../components/atoms/README.md) for the atom
  index.
- Use the design tokens consistently. Do not add a one-off custom value.
- Implement every component mobile-first — see [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) for
  the breakpoint table. Give every interactive element a touch target of at least 44×44px.
- Meet WCAG 2.1 AA.

## Route changes are already announced — do not add a second announcer

Vike Client Routing swaps the page under `<main>` while the site chrome stays in place. So a
navigation does none of what a full page load does for free: nothing resets focus, and nothing
speaks the new `document.title`. That gap fails WCAG 2.1 4.1.3 (Status Messages, AA). Issue #70
already closes it centrally.

| Piece | Where |
| --- | --- |
| One polite live region, rendered once and kept across navigations | `layouts/LayoutRoot.tsx` — in the root layout. So a bare embed route gets it too |
| `id` and `tabIndex={-1}` on `<main>`, the focus target | `layouts/LayoutChrome.tsx`, `layouts/LayoutMap.tsx` |
| The announce-and-focus logic | `lib/route-announcer.ts`, called from `pages/+onPageTransitionEnd.ts` |

Three things not to undo:

- **`tabIndex={-1}` on `<main>` is load-bearing**, though it looks like dead markup. It makes the
  element focusable by script, without adding it to the tab order. Remove it, and focus
  management silently stops working.
- **Mount the announcer once, and leave it empty in the DOM.** A live region announces only
  content inserted after a screen reader starts watching it. One mounted at the same moment as
  its own text says nothing.
- **A back/forward navigation announces, but must not move focus.** The browser restores the
  previous scroll position on that kind of navigation, and focusing `<main>` would scroll to the
  top and lose the reader's place.

A component that announces something of its own — a form result, a loading state — uses its own
live region instead (see `FormBuilder`). This one is for navigation only.

## Common component patterns

### Icon

`Icon` wraps Heroicons and takes an **`icon` prop**, not `name`.

```tsx
import { Icon } from '../atoms/Icon'
import { HeartIcon } from '@heroicons/react/24/outline'

<Icon icon={HeartIcon} size="md" />
```

This project uses Heroicons v2. Some v1 names changed — for example,
`ArrowRightOnRectangleIcon` is now `ArrowRightStartOnRectangleIcon`. Check the
[v2 migration guide](https://github.com/tailwindlabs/heroicons/releases/tag/v2.0.0) for others.

### Button

`Button` renders as a link when you pass `href`. Do not nest a `Link` inside a `Button`.

```tsx
<Button href="/meditations" variant="primary">View Meditations</Button>
<Button onClick={handleClick} variant="primary">Submit</Button>
<Button icon={PlayIcon} variant="primary" aria-label="Play" />
```

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text'
  size?: 'sm' | 'md' | 'lg'
  href?: string     // Renders as Link when set
  locale?: string
  icon?: HeroIcon
  isLoading?: boolean
  disabled?: boolean
}
```

Use `href` for navigation or a download. Use `onClick` for a JavaScript action, never `href`.

### Link

`Link` is locale-aware, at `components/atoms/Link/`. Import it from the barrel
(`'../../atoms'`) or directly (`'../../atoms/Link'`) — never from the old `'../../Link'` path.

```tsx
interface LinkProps {
  href: string
  locale?: string
  variant?: 'default' | 'primary' | 'secondary' | 'neutral' | 'unstyled'
  size?: 'sm' | 'base' | 'lg' | 'inherit'  // Default: 'inherit'
  external?: boolean
}
```

`Link` prefixes a non-English locale automatically (`/about` becomes `/es/about`). `size="inherit"`
is the default, so a link matches its parent's font size unless you set one. An `external` link
adds screen-reader text announcing it opens in a new tab.

### Focus indicator

`focusRing(theme)` in [components/atoms/focusRing.ts](../../components/atoms/focusRing.ts) is the
focus treatment to draw. Put it in the component's base styles, never in a variant map.

```tsx
const baseStyles = `transition-colors duration-200 ${focusRing(theme)}`
```

It emits a 2px ring over a 2px offset band, on `focus-visible:` and not `focus:`, so a mouse click
leaves no lingering ring and a browser without `:focus-visible` keeps its own outline instead of
losing both. The colour is `teal-600` on light and `white` on dark, with the offset band pinned to
`white` and `teal-900` to match.

A fourth rule the ring's own arrival created:

- **A component on a dark surface must be told so.** `focusRing` defaults to light, so a caller
  that omits `theme` draws a teal ring over a white band on a photograph. Thread `theme` down to
  whatever owns the interactive element — this is why `Logo` has a `theme` prop it uses for
  nothing else.

Three rules the atoms broke before this existed:

- **A ring colour is inert without a ring width.** `ring-<color>` compiles to `--tw-ring-color` and
  nothing else. Only `ring-2` writes the `box-shadow`. `Link` shipped eight colours against no
  width.
- **The ring colour is per theme, never per variant.** A per-variant axis is what let every
  light-theme colour drift under the 3:1 of WCAG 2.1 SC 1.4.11 — `teal-500` 2.70, `coral-500` 2.53,
  `gray-400` 1.71 on white. `teal-600` measures 3.85.
- **Pin `ring-offset-<color>`.** `--tw-ring-offset-color` defaults to `#fff`, so a dark-theme
  component draws a white band between itself and its ring unless you say otherwise.

Dark surfaces vary — `teal-900`, the `OrnateTextBox` brown gradient, a photographic splash — so the
dark ring is `white`, which clears 3:1 on all of them (4.68 on the lightest, `#8a6f56`). A brand
colour would not.

`Link`, `Button` and `Image` call it. `EmbedButton`, `SocialIcon`, `Radio`, `Checkbox`, `Alert`,
`Input`, `Textarea` and `Select` still carry their own treatments, and none of them has a `theme`
prop to pass — converting them is the follow-up #133 names, not a rename.

### Divider

```tsx
<div className="relative w-full text-center pt-[height]">
  <div className="w-full border-t border-gray-200 absolute bottom-0" />
  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-white px-4">
    <DecorativeElement />
  </div>
</div>
```

This centers a decorative element over the line, with a white background breaking the line
behind it.

## Refactoring a custom className to a variant

Replace a custom `className` with a built-in variant when the styling already matches one
closely. A small color or weight difference is an acceptable trade for consistency. Keep the
custom className only for what the variant does not cover.

```tsx
// Before
<Link className="text-gray-600 hover:text-teal-600 transition-colors text-sm font-light">
  {item.label}
</Link>

// After
<Link variant="neutral" size="sm" className="hover:text-teal-600 font-light">
  {item.label}
</Link>
```

To find every candidate, grep for the component plus a custom `className`. Match each hit to the
closest variant, and move its size into the `size` prop. Check the visual diff before you commit.
