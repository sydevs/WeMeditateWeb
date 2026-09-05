# Design System Implementation Guide

This guide covers component architecture, design tokens, and accessibility standards for
WeMeditate's React + Tailwind CSS component library. It uses the Atomic Design methodology.

## Atomic Design hierarchy

| Level | Definition | Directory |
| --- | --- | --- |
| Atom | The smallest UI element. It cannot divide into smaller pieces without losing its meaning. | `components/atoms/` |
| Molecule | A small group of atoms that work as one functional unit. | `components/molecules/` |
| Organism | A complex, distinct section built from molecules and atoms. | `components/organisms/` |
| Template | A page layout that places organisms into a structure, without real content. | `components/templates/` |
| Page | A template filled with real content. | `pages/`, using Vike's `+Page.tsx` files |

**When in doubt**: start at the smallest classification, then promote it if it needs to combine
with something else. Promoting an atom to a molecule is easier than demoting a molecule to an
atom.

## Design tokens

### Colors

Based on the wemeditate.com brand.

| Token | Hex | Use |
| --- | --- | --- |
| `--color-primary` | `#61aaa0` | Teal — links, primary CTAs |
| `--color-primary-light` | `#83bcb4` | Hover states, light backgrounds |
| `--color-primary-lighter` | `#c5e0dc` | Subtle backgrounds |
| `--color-primary-bg` | `#ebf4f3` | Teal background tint |
| `--color-primary-300` | `#5dd4bd` | Teal on a dark background (`teal-300`) |
| `--color-secondary` | `#e08e79` | Coral — accents, highlights |
| `--color-secondary-dark` | `#c54d2e` | Coral emphasis |
| `--color-accent` | `#ff856f` | Bright coral — strong CTAs |
| `--color-secondary-300` | `#f0a898` | Coral on a dark background (`coral-300`) |
| `--color-text-primary` | `#555` | Headings, primary text |
| `--color-text-secondary` | `#7b7b7b` | Body text |
| `--color-text-tertiary` | `#9d9d9c` | Subtle text |
| `--color-border` / `-light` | `#c6c6c6` / `#d7d7d6` | Standard / subtle borders |
| `--color-bg-white` / `-subtle` / `-light` / `-warm` | `#fff` / `#f7fbfa` / `#f6f6f6` / `#faf0e3` | Background tiers |
| `--color-error` / `-dark` | `#cc5e5e` / `#8b0000` | Error / critical error |
| `--color-success` | `#4c8d84` | Success states |
| `--color-info` | `#61aaa0` | Info states (uses primary) |

On a dark background, use `teal-300` or `coral-300` — both hold enough contrast while keeping the
brand color recognizable.

### Typography

| Token | Value | Use |
| --- | --- | --- |
| `--font-sans` (`font-sans`, `font-raleway`) | `'Raleway', sans-serif` | Default for all text |
| `--font-number` (`font-number`) | `'Futura Book', sans-serif` | Countdowns, large numbers, special headings |
| `font-extralight` | 200 | Raleway Extra Light |
| `font-light` | 300 | Raleway Light — default body |
| `font-normal` | 400 | Raleway Regular |
| `font-medium` | 500 | Raleway Medium — headings |
| `font-semibold` | 600 | Raleway Semi Bold |
| `font-bold` | 700 | Raleway Bold — emphasis |

Fonts load through `@font-face` rules in [layouts/fonts.css](./layouts/fonts.css). See
[public/fonts/README.md](./public/fonts/README.md) for the file layout.

### Everything else

Use Tailwind's defaults for spacing, font-size scale, line height, border radius, shadows, and
transitions. This keeps the project aligned with the Tailwind ecosystem, with no extra
configuration to maintain. See the [Tailwind CSS documentation](https://tailwindcss.com/docs) for
the full default scale.

## Mobile-first and responsive design

Design for the smallest screen first, then add Tailwind's responsive prefixes for larger ones.

| Prefix | Width | Device |
| --- | --- | --- |
| (none) | 0px+ | Mobile |
| `sm:` | 640px+ | Small tablets |
| `md:` | 768px+ | Tablets, laptops |
| `lg:` | 1024px+ | Laptops, desktops |
| `xl:` / `2xl:` | 1280px+ / 1536px+ | Large desktops |

Apply this to every molecule and organism. Apply it to an atom whenever it has layout
implications (a container, a spacer, a complex button). Use judgment for a simple atom (plain
text, an icon). Never skip it for a template or a page-level organism.

Every interactive element needs a touch target of at least 44×44px on mobile.

See [docs/rules/design-system.md](docs/rules/design-system.md) for the Icon, Button, Link, and
Divider component conventions, and the route-announcer rule for client-side navigation.

## Component architecture

```
components/
├── atoms/           # Basic building blocks
├── molecules/       # Simple component groups
├── organisms/       # Complex component sections
└── templates/       # Page layout structures
```

| Level | Example components |
| --- | --- |
| Atoms | Button, Input, Label, Heading, Text, Link, Icon, Image, Divider, Checkbox, Radio, Select, Toggle. Also Spinner, SplashLoader, Badge, Tag, Container, Spacer, Box, Breadcrumbs, Countdown, LanguageFlag, SocialIcon, Logo, Avatar, PageTitle. |
| Molecules | FormField, SearchBar, FormGroup, InputWithIcon, LocationSearch, NavItem, Dropdown, LanguageSelector, ContentCard, MediaCard, Stat, Quote, Alert, ContentGrid, MasonryGrid, AudioPlayer, VideoPlayer, Accordion, Tooltip |
| Organisms | Header, Footer, Sidebar, MobileMenu, Hero, TechniqueCard, MeditationGrid, ArticleList, TestimonialCarousel, FeatureSection, CTASection, ContactForm, NewsletterSignup, SearchInterface, ArticleContent, AudioLibrary, VideoGallery, RelatedContent |
| Templates | DefaultLayout, FullWidthLayout, ArticleLayout, GridLayout, SplitLayout |

See a component's own README for its full API — for example
[components/atoms/README.md](components/atoms/README.md) for the atom index.

**ContentGrid vs. MasonryGrid**: `ContentGrid` renders `ContentCard` items in a responsive
masonry layout and always shows every item. `MasonryGrid` renders text content with a "Show
More" control. Do not use them interchangeably.

## File organization

Each component lives in its own directory:

```
components/atoms/Button/
├── Button.tsx           # Main component
├── Button.types.ts      # TypeScript interfaces
├── index.ts             # Public exports
└── README.md            # Component documentation (optional)
```

### SVG components

Extract a standalone SVG into `components/atoms/graphics/svgs/`.

- Suffix the name with `Svg` (`LogoSvg`, `LeafSvg`, `TriangleDecorationSvg`).
- Accept a `className` prop for sizing. Do not add custom size props (`xs`/`sm`/`md`/`lg`).
- Extend `ComponentProps<'svg'>` for the full set of SVG attributes.
- Use `currentColor` for every fill and stroke, so the graphic inherits the surrounding text
  color.
- Keep the original default `className` from the inline version you extracted it from.
- Extract a new SVG component for a brand icon, an illustration, or a decorative element. Keep an
  inline SVG only when it is specific to one component. For a standard UI icon, use the `Icon`
  component (Heroicons) instead of a new SVG component.

```tsx
import { ComponentProps } from 'react'

export interface LogoSvgProps extends ComponentProps<'svg'> {}

export function LogoSvg({ className = 'w-5 h-5', ...props }: LogoSvgProps) {
  return (
    <svg viewBox="0 0 18 14" className={className} fill="none" {...props}>
      <g fill="none" fillRule="evenodd" stroke="currentColor" strokeWidth=".75" />
    </svg>
  )
}
```

### Naming conventions

| What | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `Button`, `MediaCard` |
| Files | Match the component name | `Button.tsx` |
| Props | camelCase, descriptive | `isLoading`, `onSubmit` |
| Boolean props | Prefix `is`, `has`, `should`, or `can` | `isOpen`, `hasError` |
| Custom CSS classes | kebab-case (prefer Tailwind utilities) | `hero-gradient` |

## Component design checklist

Before you implement a component, answer each question:

- [ ] What is this component's single responsibility?
- [ ] Is this the right atomic level (atom, molecule, organism)?
- [ ] Can it divide into smaller components?
- [ ] Does something similar already exist?
- [ ] What is the smallest prop set that keeps it flexible?
- [ ] What states can it be in?
- [ ] How will different contexts use it?

## When to extract a component

| Use direct Tailwind classes when | Extract a component when |
| --- | --- |
| The styling is simple (a div, a span, plain text) | It has complex interactive behavior (state, effects, event handlers) |
| The styling is specific to one page or component | It repeats in 3 or more locations |
| It is used in only 1–2 places | It composes several atoms (a molecule) |
| It has no state, effects, or behavior | It needs many conditional styles or variants |
| | It renders as different HTML elements (a polymorphic `Heading`) |

If a wrapper only repeats Tailwind classes with no logic, use the classes directly instead. The
project removed its `Text` component for this reason — it wrapped Tailwind classes with no added
behavior, and callers now write `<div className="text-sm sm:text-base font-light">` directly.

To remove an overengineered component:
1. Find every import: `grep -r "from '.*ComponentName'"`.
2. Replace each usage with direct HTML and Tailwind classes.
3. Remove it from the barrel export, then remove the component files.

## Extract a design from an existing page

1. Identify the atomic level, and note where and how the design is used.
2. Read the values from DevTools: layout and spacing (`padding`, `margin`, `display`), typography
   (`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`), color
   (`color`, `background`, `borderColor`), and any `::before`/`::after` pseudo-elements.
3. Map each value to the closest Tailwind token:

   | CSS value | Tailwind token |
   | --- | --- |
   | `8px` / `16px` / `24px` / `32px` | `2` / `4` / `6` / `8` |
   | `14px` / `16px` / `18px` / `32px` font size | `text-sm` / `text-base` / `text-lg` / `text-4xl` |
   | `0.3` opacity | `/30` |
   | An arbitrary opacity (`0.18`) | `/[0.18]` |
4. Implement mobile-first, then add `sm:`/`md:`/`lg:` overrides, and test every breakpoint.
5. Check the edge cases: long text, a missing optional field, and every viewport size.
6. Compare the result to the original design, and check accessibility (contrast, semantic HTML,
   ARIA).

See [MCP_USAGE.md](MCP_USAGE.md) for the Puppeteer workflow that extracts these values from a
live page.

## Size variants

Use a three-tier scale: `sm`, `md` (default), `lg`. Small suits a compact element, like a card or
a thumbnail. Medium suits most content areas. Large suits a hero section or a full-page element.
Scale each size roughly 20–30% over the previous one, and scale gaps proportionally with the
element.

```tsx
const sizeClasses = {
  sm: { element: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24', text: 'text-sm sm:text-base md:text-lg' },
  md: { element: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28', text: 'text-base sm:text-lg md:text-xl' },
  lg: { element: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40', text: 'text-lg sm:text-xl md:text-2xl' },
}
```

Give a `size` prop this default: `size = 'md'`. Always implement all three tiers, document which
one to use where, and test each at every breakpoint.

## Width control

`w-full` and a narrower `w-*` class have the same CSS specificity. Overriding `w-full` with
`className="w-64"` does not work reliably — whichever rule comes last in the generated
stylesheet wins, not whichever comes last in the JSX.

Use `max-w-*` instead, since `max-width` composes with `width: 100%`:
```tsx
<Input className="max-w-xs" />   // caps it at 20rem
```
Or wrap the component in a sized container, when you also need centering (`mx-auto`) or a shared
width across several inputs:
```tsx
<div className="max-w-md mx-auto"><Input /></div>
```

## Subcomponent extraction

Extract a subcomponent into the same file when the pattern repeats 2–3 times within one parent
and is specific to that parent's context. It should remove 30 or more duplicate lines. Define it
above the parent's export, with its own prop interface even when that interface is not exported.

Create a separate atom component instead when multiple different parents use the pattern,
or you expect 3 or more use sites.

## Rich text rendering

PayloadCMS content arrives as a rich-text AST. Build one renderer per node type under
`components/organisms/RichTextRenderer/nodes/` (`HeadingNode`, `ParagraphNode`, `ImageNode`,
`QuoteNode`, and so on), and switch on `node.type` in the top-level renderer.

## Locale-aware components

Use the `Link` component from `components/atoms/Link` for internal navigation — it prefixes the
locale automatically (`/meditation` becomes `/es/meditation` in Spanish). A custom component that
needs the locale reads it from `usePageContext()` (`vike-react/usePageContext`).

## State management

Use `useState` for state local to one component. Fetch server state in a page's `+data.ts`, then
read it with `useData()`. Use Vike's routing for URL state (filters, pagination). Reach for React
Context only when composition does not work, since it is the exception here, not the default.

## Performance

- Serve images as WebP with a fallback (`<picture>` + `<source type="image/webp">`).
- Lazy-load a heavy component with `React.lazy` and wrap it in `<Suspense>`.
- Memoize an expensive computation with `useMemo`, and a callback passed to a memoized child with
  `useCallback`.

## Accessibility (WCAG 2.1 AA)

| Area | Requirement |
| --- | --- |
| Keyboard | Every interactive element is reachable by keyboard, in the visual tab order, with a visible focus ring (`focus:ring-2 focus:ring-teal-600`). Escape closes a modal or dropdown. |
| Semantic HTML | Use `<nav>`, `<main>`, `<article>`, `<button>` for actions, `<a>` for navigation, and `<h1>`–`<h6>` in order. |
| ARIA | Add ARIA only where semantic HTML falls short — `aria-expanded`/`aria-haspopup` on a dropdown trigger, `aria-busy`/`aria-live` on a loading button. |
| Color contrast | 4.5:1 for normal text, 3:1 for large text (18pt+) and for UI components. |
| Alt text | A decorative image uses `alt=""` and `role="presentation"`. An informative image needs a real description. |
| Forms | Pair every input with a `<label htmlFor>`, and set `aria-invalid` and `aria-describedby` on an errored field, pointing at an `id` with `role="alert"`. |

## Tailwind configuration

[tailwind.config.ts](./tailwind.config.ts) extends only brand identity: the teal and coral color
palettes with semantic names (error, success, info), and the Raleway/Futura Book font families
(weights 200–700). Everything else uses Tailwind's defaults.

**v4 gradient syntax**: Tailwind v4 renamed the gradient-direction utilities for consistency with
CSS. Use `bg-linear-to-*`, not the v3 `bg-gradient-to-*`:
```tsx
className="bg-linear-to-b from-white to-transparent"  // top to bottom
```
The same rename applies to every direction: `-t`, `-r`, `-l`, `-br`, `-bl`, `-tr`, `-tl`.

## Cloudflare Images

The `<Image>` atom detects an `imagedelivery.net/` URL and appends a variant name
`{aspectRatio}-{width}` to request an optimized, format-negotiated image, plus a matching
`srcset`. A non-Cloudflare URL (a static asset, a story placeholder) stays unchanged.

| Aspect ratio | Widths |
| --- | --- |
| `square` (1:1) | 400, 800, 1200 |
| `video` (16:9) | 640, 800, 1024, 1536 |
| `4-3`, `3-2` | 800, 1024, 1536 |
| `ultrawide` (21:9) | 1536, 2048 |

**Size tiers**: `small` \| `medium` (default) \| `large` \| `xlarge`. When a tier is undefined for
a ratio, the helper defaults to `medium`, then to that ratio's smallest width. This way, the
variant it returns always exists in the Cloudflare dashboard. Adding a new variant here also
needs a matching variant in the Cloudflare dashboard. The code list alone is not enough.

`<Splash>` and `<SplashLoader>` expose `imageAspectRatio`/`imageSize` for the same treatment
(default `ultrawide`/`xlarge`). The old slash notation maps as: `16/9` → `video`, `21/9` →
`ultrawide`, `4/3` → `4-3`, `3/2` → `3-2`. See
[lib/cloudflare-images.ts](./lib/cloudflare-images.ts) for the source.

## Icons

This project uses [Heroicons](https://heroicons.com/) — outline (24×24) and solid (24×24, 20×20),
MIT licensed and tree-shakeable. Import from `@heroicons/react/24/outline` or `/solid`, and pass
the icon component to the `Icon` wrapper:

```tsx
import { HeartIcon } from '@heroicons/react/24/outline'
import { Icon } from './components/atoms'

<Icon icon={HeartIcon} size="lg" color="primary" />
```

## Component stories

Every component needs a Ladle story for visual documentation and isolated development. See
[STORYBOOK.md](STORYBOOK.md) for the story utility components, section order, and configuration.
Run `pnpm ladle` to view every story at [http://localhost:61000/](http://localhost:61000/).

## Manual testing checklist

Before you mark a component complete, check it:

- [ ] Renders correctly on mobile, tablet, and desktop.
- [ ] Works with keyboard navigation, with a visible focus indicator.
- [ ] Handles its loading and error states.
- [ ] Works with both short and long content.
- [ ] Works in every supported locale.
- [ ] Passes the accessibility checks above.

## Resources

- [AGENTS.md](./AGENTS.md) — project overview, repo-wide conventions, and the rule map
- [docs/rules/design-system.md](./docs/rules/design-system.md) — the `components/**` rule that
  points here, plus Icon/Button/Link/Divider conventions this guide does not cover
- [server/CACHING.md](./server/CACHING.md) — the CMS caching strategy
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/) — Brad Frost's
  original methodology
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
