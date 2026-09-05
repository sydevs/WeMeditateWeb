# Atoms

Atoms are the foundational UI elements of the WeMeditate design system. Each one is the smallest
functional piece — it cannot divide into smaller pieces without losing its meaning.

## Component index

| Category | Components |
| --- | --- |
| Content | Heading, PageTitle, Blockquote, Link |
| Interactive | Button, Dropdown, Tooltip |
| Form inputs | Input, Textarea, Checkbox, Radio, Select |
| Media | Image, Icon, Avatar |
| Brand and graphics | Logo, LanguageFlag, SocialIcon, and the SVG icons in `graphics/svgs/` |
| Feedback | Spinner, SplashLoader, Placeholder, Badge |
| Layout | Container, Spacer, Box, LeafDivider, Breadcrumbs |
| Specialty | Countdown |

Typography patterns (sizing, weight, color) live in
[Typography.stories.tsx](./Typography.stories.tsx) as documentation, with no component wrapper.
Use Tailwind utility classes directly for text styling instead.

## Import

Import from the barrel:
```tsx
import { Button, Heading, Input, Image } from '.'
```

Or import a single component directly:
```tsx
import { Button } from './Button'
```

This project has no `@/*` path alias. Use a relative import — from `components/atoms/`, `.` is
the barrel and `./ComponentName` is a single component.

## Design principles

1. **Single responsibility** — each atom does one thing well.
2. **Composability** — atoms combine into molecules and organisms.
3. **Accessibility** — WCAG 2.1 AA, with the right ARIA attributes.
4. **Type safety** — full TypeScript prop types.
5. **Tailwind first** — built from Tailwind utility classes.
6. **Mobile first** — responsive by default.

## Component guidelines

**Props**: extend the native HTML element's props where it fits. Use a discriminated union for
mutually exclusive props. Give every optional prop a sensible default.

**Styling**: use Tailwind utility classes directly, following the tokens in
`tailwind.config.ts`. Accept a `className` prop for the caller to extend styling. Include a
visible focus state for keyboard use.

**Accessibility**: use semantic HTML, add ARIA attributes where semantic HTML falls short, and
support keyboard navigation and screen readers.

For token values, the full component architecture, and worked examples, see
[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md).

## Related documentation

- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) — tokens, architecture, and implementation guidelines
- [docs/rules/design-system.md](../../docs/rules/design-system.md) — the `components/**` rule Claude Code loads automatically
- [AGENTS.md](../../AGENTS.md) — repo-wide conventions and a map of the rules, skills, and reference docs

## Add a new atom

1. Follow the component template in [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md).
2. Create the component directory, with `Component.tsx` and `index.ts`.
3. Add a JSDoc comment with a usage example.
4. Export the component from `atoms/index.ts`.
5. Add it to the component index table above.
6. Test it across breakpoints, and check its accessibility.
